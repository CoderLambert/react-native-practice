import { router } from 'expo-router';
import { Screen, Heading, Button } from '../ui/components';
export default function NotFound() {
  return <Screen><Heading eyebrow="404" title="页面不存在" subtitle="链接可能已失效。" /><Button title="返回资讯" onPress={() => router.replace('/')} /></Screen>;
}
