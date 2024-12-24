type ShortcutHandler = () => void;

interface ShortcutMap {
  [key: string]: {
    action: ShortcutHandler;
    description: string;
  };
}

export class KeyboardShortcuts {
  private shortcuts: ShortcutMap = {};

  register(key: string, action: ShortcutHandler, description: string) {
    this.shortcuts[key.toLowerCase()] = { action, description };
  }

  handle(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    const shortcut = this.shortcuts[key];
    
    if (shortcut && !event.repeat) {
      event.preventDefault();
      shortcut.action();
    }
  }

  getShortcuts() {
    return Object.entries(this.shortcuts).map(([key, { description }]) => ({
      key,
      description,
    }));
  }
} 