/**
 * @name ArukuGenderHighlighter
 * @description Добавляет отображение девочек в голосовых каналах на аруку!
 * @version 1.1
 * @author clitorium&ladno
 * @website https://github.com/clitorium/ArukuGenderHighlighter
 * @source https://raw.githubusercontent.com/clitorium/ArukuGirls/main/ArukuGenderHighlighter.plugin.js
 */

const config = {
    name: "ArukuGenderHighlighter",
    author: "clitorium&ladno",
    version: "1.1",
    description: "Добавляет отображение девочек в голосовых каналах на аруку!",
    github: "https://github.com/clitorium/ArukuGenderHighlighter",
    github_raw: "https://raw.githubusercontent.com/clitorium/ArukuGirls/main/ArukuGenderHighlighter.plugin.js",
    changelog: [
        {
            title: "Хайпуем сучки!",
            type: "fixed",
            items: [
                "Добавили вам возможность видеть девочек в голосовых чатах! Они подвесчиваются розовым."
            ]
        }
    ],
    defaultConfig: [
        {
            type: "category",
            id: "global",
            name: "Настройки плагина",
            collapsible: true,
            shown: true,
            settings: [
                {
                    type: "switch",
                    id: "voice",
                    name: "Войсчаты",
                    note: "Подвечивать ли девочек в голосовых каналах? (грязь)",
                    value: true
                },
                {
                    type: "switch",
                    id: "saturation",
                    name: "Использовать сатурацию",
                    note: "Соблюдать уровень насыщенности, установленный в настройках специальных возможностей Discord?",
                    value: true
                }
            ]
        }
    ],
    main: "index.js"
};
class Dummy {
    constructor() {this._config = config;}
    start() {}
    stop() {}
}
 
if (!global.ZeresPluginLibrary) {
    BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.name ?? config.info.name} is missing. Please click Download Now to install it.`, {
        confirmText: "Download Now",
        cancelText: "Cancel",
        onConfirm: () => {
            require("request").get("https://betterdiscord.app/gh-redirect?id=9", async (err, resp, body) => {
                if (err) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                if (resp.statusCode === 302) {
                    require("request").get(resp.headers.location, async (error, response, content) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), content, r));
                    });
                }
                else {
                    await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                }
            });
        }
    });
}
 
module.exports = !global.ZeresPluginLibrary ? Dummy : (([Plugin, Api]) => {
     const plugin = (Plugin, Api) => {
    const {WebpackModules, DiscordModules, Patcher, Utilities, Logger} = Api;

    const GuildMemberStore = DiscordModules.GuildMemberStore;
    const SelectedGuildStore = DiscordModules.SelectedGuildStore;
    const VoiceUser = WebpackModules.getByPrototypes("renderName", "renderAvatar");

    return class BetterRoleColors extends Plugin {

        onStart() {
            Utilities.suppressErrors(this.patchVoiceUsers.bind(this), "voice users patch")();

            this.promises = {state: {cancelled: false}, cancel() {this.state.cancelled = true;}};
        }

        onStop() {
            Patcher.unpatchAll();
            this.promises.cancel();
            if (this.unpatchAccountDetails) {
                this.unpatchAccountDetails();
                delete this.unpatchAccountDetails;
            }
        }

        getSettingsPanel() {
            return this.buildSettingsPanel().getElement();
        }

        getMember(userId, guild = "") {
            const guildId = guild || SelectedGuildStore.getGuildId();
            if (!guildId) return null;
            const member = GuildMemberStore.getMember(guildId, userId);
            if (!guildId) return null;
            return member;
        }

        patchVoiceUsers() {        
            Patcher.after(VoiceUser.prototype, "renderName", (thisObject, _, returnValue) => {
                if (!this.settings.global.voice) {
                    Logger.log("Voice module setting is disabled.");
                    return;
                }        
                const member = this.getMember(thisObject?.props?.user?.id);
                if (!member || !member.colorString) {
                    Logger.warn(`Member not found or no colorString. User ID: ${thisObject?.props?.user?.id}`);
                    return;
                }

                let colorstring = '';

                if (member.roles.includes("1089888911439966289")) {
                    colorstring = '#f0bdbd';
                } else {
                    colorstring = '#949BA4';
                }
        
                const usernameElement = returnValue.props.children.props.children;
        
                if (!usernameElement || !usernameElement.props || !usernameElement.props.className) {
                    Logger.warn("Username element not found.");
                    return;
                }
        
                // Применение стиля
                usernameElement.props.style = { ...usernameElement.props.style, color: colorstring, backfaceVisibility: "hidden" };
        
                if (this.settings.global.saturation) {
                    usernameElement.props["data-accessibility"] = "desaturate";
                }
            });
        }

    };
};
     return plugin(Plugin, Api);
})(global.ZeresPluginLibrary.buildPlugin(config));
/*@end@*/
