import { fireEvent, render } from '@testing-library/react-native';
import { ArticleCard } from '../src/features/news/ArticleCard';
import { Button, Choice } from '../src/ui/components';
import { DEMO_ARTICLES } from '../src/data/demo-source';

it('opens the selected article with an accessible control', () => {
  const onPress = jest.fn(); const article = DEMO_ARTICLES[0]!;
  const screen = render(<ArticleCard article={article} onPress={onPress} />);
  fireEvent.press(screen.getByRole('button', { name: `阅读：${article.title}` }));
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(screen.getByText('全文')).toBeTruthy();
});
it('does not report link-only content as full text', () => {
  const screen = render(<ArticleCard article={{ ...DEMO_ARTICLES[0]!, bodyKind: 'summary' }} onPress={() => undefined} />);
  expect(screen.getByText('摘要 / 链接')).toBeTruthy();
});
it('disabled actions do not invoke callbacks', () => {
  const onPress = jest.fn(); const screen = render(<Button title="保存" disabled onPress={onPress} />);
  fireEvent.press(screen.getByRole('button', { name: '保存' })); expect(onPress).not.toHaveBeenCalled();
});
it('choices expose selected state to assistive technology', () => {
  const screen = render(<Choice label="浅色" selected onPress={() => undefined} />);
  expect(screen.getByRole('radio', { name: '浅色', checked: true })).toBeTruthy();
});
