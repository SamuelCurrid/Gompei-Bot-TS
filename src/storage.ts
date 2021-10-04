import fs from 'fs/promises';
import path from 'path';

export class StorageManager {
    private configs = new Map<new () => Store, [Store, Promise<void>]>();

    load<T extends Store>(Config: new () => T): [T, Promise<void>] {
        if (this.configs.has(Config)) {
            return this.configs.get(Config) as [T, Promise<void>];
        }
        const config = new Config();
        const configPromise = config.init();
        this.configs.set(Config, [config, configPromise]);
        return [config, configPromise];
    }
}

export abstract class Store<T = any> {
    abstract configName: string;
    protected abstract defaultConfig: T;

    private get path() {
        return path.resolve(process.env.STORAGE_PATH ?? './storage/', `${this.configName}.json`)
    }

    abstract init(): Promise<void>;

    async fetch(): Promise<T> {
        try {
            await fs.stat(this.path)
            const contents = await fs.readFile(this.path, { encoding: 'utf-8' });
            const result = JSON.parse(contents);
            return result;
        }
        catch (e) {
            return this.defaultConfig;
        }
    }

    protected async save(value: T) {
        await fs.mkdir(path.dirname(this.path), { recursive: true });
        await fs.writeFile(this.path, JSON.stringify(value), { encoding: 'utf-8' });
    }
}

