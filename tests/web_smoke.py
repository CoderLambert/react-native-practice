"""Smoke test of the actual exported app, not a mock HTML screen.
Needs playwright==1.56.0 and Google Chrome/Chromium. Run after pnpm export:web.
Web storage is not evidence of Android SQLite behavior.
"""
import json
import shutil
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / 'dist/web'
OUT = ROOT / 'artifacts/web'
OUT.mkdir(parents=True, exist_ok=True)

class SPA(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB), **kwargs)
    def do_GET(self):
        if not Path(self.translate_path(self.path)).exists():
            self.path = '/index.html'
        super().do_GET()
    def log_message(self, *_args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), SPA)
Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
errors = []
checks = []
with sync_playwright() as p:
    chrome = shutil.which('google-chrome') or shutil.which('chromium')
    browser = p.chromium.launch(executable_path=chrome, headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
    page.set_default_timeout(15000)
    page.on('pageerror', lambda error: errors.append(str(error)))
    try:
        page.goto(base, wait_until='networkidle')
        expect(page.get_by_test_id('article-demo-1')).to_be_visible()
        page.screenshot(path=str(OUT / '01-feed.png'))
        checks.append('default original demo feed renders')
        page.get_by_test_id('load-more').click()
        expect(page.get_by_test_id('article-demo-6')).to_be_attached()
        checks.append('second page loads')
        page.get_by_test_id('feed-search').fill('Kotlin')
        expect(page.get_by_test_id('article-demo-3')).to_be_visible()
        expect(page.get_by_test_id('article-demo-1')).to_have_count(0)
        page.get_by_test_id('feed-search').fill('')
        checks.append('search filters loaded content')
        page.get_by_test_id('article-demo-1').click()
        expect(page).to_have_url(base + '/article/demo-1')
        page.get_by_test_id('bookmark-toggle').click()
        expect(page.get_by_test_id('bookmark-toggle')).to_contain_text('取消收藏')
        page.screenshot(path=str(OUT / '02-reader.png'))
        checks.append('article navigation and durable bookmark write')
        page.goto(base + '/saved', wait_until='networkidle')
        expect(page.get_by_test_id('article-demo-1')).to_be_visible()
        page.reload(wait_until='networkidle')
        expect(page.get_by_test_id('article-demo-1')).to_be_visible()
        page.screenshot(path=str(OUT / '03-saved.png'))
        checks.append('bookmark survives full document reload')
        page.goto(base + '/settings', wait_until='networkidle')
        page.get_by_role('button', name='仅清理资讯缓存（保留收藏）').click()
        expect(page.get_by_text('资讯缓存已清除，收藏仍然保留；下次加载会重建缓存')).to_be_visible()
        page.get_by_role('radio', name='深色', exact=True).click()
        expect(page.get_by_role('radio', name='深色', exact=True)).to_have_attribute('aria-checked', 'true')
        page.reload(wait_until='networkidle')
        expect(page.get_by_role('radio', name='深色', exact=True)).to_have_attribute('aria-checked', 'true')
        page.screenshot(path=str(OUT / '04-settings-dark.png'))
        checks.append('theme persists across reload')
        page.goto(base + '/saved', wait_until='networkidle')
        expect(page.get_by_test_id('article-demo-1')).to_be_visible()
        checks.append('cache clearing preserves bookmarks')
        page.goto(base + '/lab', wait_until='networkidle')
        expect(page.get_by_role('button', name='读取系统状态', exact=True)).to_be_disabled()
        page.screenshot(path=str(OUT / '05-lab.png'))
        checks.append('web does not pretend to support Android APIs')
        assert not errors, errors
        checks.append('no uncaught JavaScript exceptions')
    except Exception:
        page.screenshot(path=str(OUT / 'failure.png'), full_page=True)
        raise
    finally:
        (OUT / 'results.json').write_text(json.dumps({'checks': checks, 'pageErrors': errors}, ensure_ascii=False, indent=2))
        print(json.dumps({'checks': checks, 'pageErrors': errors}, ensure_ascii=False, indent=2))
        browser.close()
        server.shutdown()
