
import * as fs from 'fs';

interface ConfigObject{
    freshClientKey?: string;
    username?: string;
    password?: string;
}


export class Config {
    protected data: ConfigObject;
    protected static configPath: string = './config/client.json';
    private static instance: Config;

    protected constructor(){

        if (!fs.existsSync(Config.configPath)) {
            //Create a new config file
            this.data = {};
            this.saveConfig();
        }
        this.data = JSON.parse(fs.readFileSync(Config.configPath, 'utf8'));
    }

    protected saveConfig(){
        fs.writeFileSync(Config.configPath, JSON.stringify(this.data));
    }

    public static init(): Config{
        if(!Config.instance){
            Config.instance = new Config();
        }
        return Config.instance;
    }

    public get(key: keyof ConfigObject ): any | null{
        return Config.instance.data[key] || null;
    }

    public set(key: keyof ConfigObject, value: any): void{
        Config.instance.data[key] = value;
        Config.instance.saveConfig();
    }

    public bulkSet(object: ConfigObject): void{
        for(var key in object){
            Config.instance.data[key] = object[key];
        }
        Config.instance.saveConfig();
    }
}


