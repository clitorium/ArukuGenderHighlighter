/**
 * @name ArukuGenderHighlighter
 * @description Добавляет отображение девочек в голосовых каналах на аруку!
 * @version 1.8
 * @author clitorium&ladno
 * @website https://github.com/clitorium/ArukuGenderHighlighter
 * @source https://raw.githubusercontent.com/clitorium/ArukuGirls/main/ArukuGenderHighlighter.plugin.js
 */

/*@cc_on
@if (@_jscript)

	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\Roaming\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();

@else@*/

const config = {
    name: "ArukuGenderHighlighter",
    author: "clitorium&ladno",
    version: "1.8",
    description: "Добавляет отображение девочек по гендерке на аруку!",
    github: "https://github.com/clitorium/ArukuGenderHighlighter",
    github_raw: "https://raw.githubusercontent.com/clitorium/ArukuGirls/main/ArukuGenderHighlighter.plugin.js",
    changelog: [
        {
            title: "Хайпуем сучки!",
            type: "fixed",
            items: [
                "Добавили вам возможность видеть девочек в голосовых чатах! Они подвесчиваются розовым.",
                "Так же, при упоминании человека отображается цвет его гендерной роли",
                "1.5: Оптимизация",
                "1.8: Добавлена функция, теперь можно включить отображение гендерок на трибуне в поднятых ручках"
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
                    id: "chat",
                    name: "Чаты",
                    note: "Подвечивать ли девочек в текстовых каналах? (грязь)",
                    value: false
                },
                {
                    type: "switch",
                    id: "mentions",
                    name: "Упоминания",
                    note: "Подсвечивать ли девочек в упоминаниях?",
                    value: true
                },
                {
                    type: "switch",
                    id: "stage",
                    name: "Трибуны",
                    note: "Красить ли ники в поднятых руках на трибуне в зависимости от гендерок?",
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
    const {WebpackModules, DiscordModules, Patcher, Utilities, Logger, ColorConverter} = Api;
    const {ReactUtils, Utils} = window.BdApi;

    const GuildMemberStore = DiscordModules.GuildMemberStore;
    const SelectedGuildStore = DiscordModules.SelectedGuildStore;
    const VoiceUser = WebpackModules.getByPrototypes("renderName", "renderAvatar");

    return class BetterRoleColors extends Plugin {

        onStart() {
        
            Utilities.suppressErrors(this.patchVoiceUsers.bind(this), "voice users patch")();
            Utilities.suppressErrors(this.patchMessageContent.bind(this), "message content patch")();

            this.promises = {state: {cancelled: false}, cancel() {this.state.cancelled = true;}};
        }

        onStop() {
            Patcher.unpatchAll();
            this.promises.cancel();
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
                    return;
                }        
                const member = this.getMember(thisObject?.props?.user?.id);
                if (!member || !member.colorString) {
                    return;
                }


                if (member.roles.includes("1089888911439966289")) {
                    const colorstring = '#f0bdbd';
                    const usernameElement = returnValue.props.children.props.children;

                    
                    if (!usernameElement || !usernameElement.props || !usernameElement.props.className) {
                        return;
                    }
                
                    if (!usernameElement.props.className.includes('usernameSpeaking_')) {
                        usernameElement.props.style = { ...usernameElement.props.style, color: colorstring, backfaceVisibility: "hidden" };
                    }
                }
            });
        }

        patchMessageContent() {
            const MessageContent = WebpackModules.getModule(m => m?.type?.toString().includes("messageContent") && m?.type?.toString().includes("MESSAGE_EDITED"));
            Patcher.after(MessageContent, "type", (_, [props], returnValue) => {
                if (!this.settings.global.chat) return;
                const channel = DiscordModules.ChannelStore.getChannel(props.message.channel_id);
                if (!channel || !channel.guild_id) return;
                const member = this.getMember(props.message.author.id, channel.guild_id);
                if (member.roles.includes("1089888911439966289")) {
                    const colorstring = '#f0bdbd';
                    const refFunc = (element) => {
                        if (!element) return;
                        element.style.setProperty("color", colorstring || "", "important");
                    };
                    returnValue.props.style = {color: colorstring || ""};
                    returnValue.ref = refFunc;
                }
            });
        }

        observer({addedNodes}) {
            if (!addedNodes?.length) return;
            const element = addedNodes[0];
            if (element.nodeType !== 1) return;
            this.colorMentions(element);
            this.StageParticipants(element);
        }

        StageParticipants(element) {
            if (!this.settings.global.stage) return;
            element = element.querySelectorAll("[class^='participantMemberContainer_']");
            if (!element?.length) return;
            for (const memb of element) {
                const instance = ReactUtils.getInternalInstance(memb);
                if (!instance) continue;
                const props = Utils.findInTree(instance, p => p?.memoizedProps?.children?.[0]?.props?.user, { walkable: ["memoizedProps", "return"] });
                if (!props) continue;
                const user = props.memoizedProps.children[0].props.user;
                const member = GuildMemberStore.getMember(SelectedGuildStore.getGuildId(), user);
                if (!member?.roles) continue;
                if (member.roles.includes("1089888911439966289")) {
                    var colorstring = '#f0bdbd';
                } else {
                    var colorstring = '#8db0dd';
                }
                const textContainer = memb.querySelector("[class^='participantTextContainer_']");
                if (!textContainer) continue;
                const participantName = textContainer.querySelector("span[class^='participantName_']");
                if (!participantName) continue;
                participantName.style.setProperty("color", colorstring);
            }
        }

        colorMentions(element) {
            if (!this.settings.global.mentions) return;
            if (element.matches(".mention")) element = [element];
            element = element.querySelectorAll(".mention");
            if (!element?.length) return;
            for (const mention of element) {
                if (mention.className.includes("role") || mention.className.includes("command")) continue;
                const instance = ReactUtils.getInternalInstance(mention);
                if (!instance) continue;
                const props = Utils.findInTree(instance, p => p?.userId || (p?.id && p?.guildId), {walkable: ["memoizedProps", "return"]});
                if (!props) continue;
                const member = GuildMemberStore.getMember(SelectedGuildStore.getGuildId(), props.userId ?? props.id);
                if (!member?.roles) continue;
                if (member.roles.includes("1089888911439966289")) {
                    const colorstring = '#f0bdbd';
                    mention.style.setProperty("color", colorstring);
                    mention.style.setProperty("background-color", `rgb(${ColorConverter.getRGB(colorstring).join(", ")}, 0.1)`);
                    mention.addEventListener("mouseenter", () => mention.style.setProperty("background-color", `rgb(${ColorConverter.getRGB(colorstring).join(", ")}, 0.3)`));
                    mention.addEventListener("mouseleave", () => mention.style.setProperty("background-color", `rgb(${ColorConverter.getRGB(colorstring).join(", ")}, 0.1)`));
                }
            }
        }

    };
};
     return plugin(Plugin, Api);
})(global.ZeresPluginLibrary.buildPlugin(config));
/*@end@*/
