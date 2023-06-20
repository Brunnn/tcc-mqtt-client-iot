import { IClientOptions, connect } from "mqtt";
import { Config } from "./util/config";
import { v4 } from "uuid";
const globalConfig = Config.init();

//Check if its a brand new client
var agreedCredentialTopic = null;
var brandNewClient = false;
if (!globalConfig.get("username")) {
    agreedCredentialTopic = v4();
    brandNewClient = true;
}

function mqttConnectOptions(): IClientOptions {
    return {
        clientId: globalConfig.get("username"),
        username:
            globalConfig.get("username") ??
            globalConfig.get("freshClientKey") + "/" + agreedCredentialTopic,
        password: globalConfig.get("password"),
        clean: globalConfig.get("username") ? false : true,
        reconnectPeriod: 10000,
    };
}

function initClient() {
    var config = mqttConnectOptions();
    console.log("Connecting with config: ", config);
    const client = connect("mqtt://localhost:1883", config);

    client.on("connect", function (a) {
        console.log("Connected", a);
        if (brandNewClient)
            client.subscribe("client/" + agreedCredentialTopic, { qos: 2 });
    });

    //Error
    client.on("error", function (error) {
        console.log("Error: ", error);
    });

    client.on("reconnect", function (r) {
        console.log("Reconnect: ", r);
    });

    client.on("message", function (topic, message) {
        console.log(topic, message.toString());
        try {
            var messageJSON = JSON.parse(message.toString());
        } catch (e) {
            console.log("Invalid JSON");
            return;
        }
        switch (topic) {
            case "client/" + agreedCredentialTopic:
                //Save the credentials
                globalConfig.bulkSet({
                    username: messageJSON.username,
                    password: messageJSON.password,
                    freshClientKey: null,
                });

                //publish to the agreed topic to clear the credentials
                client.publish("client/" + agreedCredentialTopic, "")

                brandNewClient = false;
                //after saving the credentials, reconnect with the new credentials
                client.end();
                initClient();
        }
    });
}

initClient();