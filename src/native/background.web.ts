export async function backgroundStatus() { return { registered: false, available: false, last: null as string | null }; }
export async function setBackgroundEnabled(_enabled: boolean): Promise<void> { throw new Error('后台刷新需要原生应用'); }
export async function testBackgroundTask(): Promise<void> { throw new Error('后台刷新需要原生应用'); }
