export function combineClassNames(...args: (string | null | undefined)[]) {
  const classNames: string[] = [];
  args.forEach(item => {
    if (typeof item !== 'string') {
      return;
    }
    item = item.trim();
    if (!item) {
      return;
    }
    item.split(' ').forEach(className => {
      if (classNames.indexOf(className) === -1) {
        classNames.push(className);
      }
    });
  });
  return classNames.join(' ');
}