const SteamAPI = require("steamapi"); global.SteamAPI = SteamAPI;
const steam = new SteamAPI("2BC68B7F897FA440D75A733D5F3B1E8A"); global.steam = steam;
const PREFIX = " "; global.PREFIX = PREFIX;
const guildInvites = new Map(); global.guildInvites = guildInvites;
 
const reaction_numbers = ["\u0030\u20E3", "\u0031\u20E3", "\u0032\u20E3", "\u0033\u20E3", "\u0034\u20E3", "\u0035\u20E3", "\u0036\u20E3", "\u0037\u20E3", "\u0038\u20E3", "\u0039\u20E3", "🔟"];
global.reaction_numbers = reaction_numbers;

const GuildInfo = {
    MusicPlayer: {
        current_music_type: {},
        current: {},
        list: {},
        song_connection: {},
        connection: {},
        paused: {},
        loop_current_song: {},
        loop_current_queue: {},
        start_time: {},
        search_list: {},
        channel_check_interval: {}
    },
    prefix: {}
};
global.GuildInfo = GuildInfo;

const ChannelInfo = {
    snipe: {}
}
global.ChannelInfo = ChannelInfo;

const in_ticket_progress = {}; global.in_ticket_progress = in_ticket_progress;
const NumeratoareEnabled = {}; global.NumeratoareEnabled = NumeratoareEnabled;
const available_ssh_logged_users = 0; global.available_ssh_logged_users = available_ssh_logged_users;
const last_ssh_login_ip = "0"; global.last_ssh_login_ip = last_ssh_login_ip;
const invites = {}; global.invites = invites;
const settings_manage = {}; global.settings_manage = settings_manage;
const roles_permissions_manage = {}; global.roles_permissions_manage = roles_permissions_manage;
const user_messages = {}; global.user_messages = user_messages;
const user_total_messages = {}; global.user_total_messages = user_total_messages;
const Current_Downloading_mp3 = {}; global.Current_Downloading_mp3 = Current_Downloading_mp3;
const Diploma_Cooldown = {}; global.Diploma_Cooldown = Diploma_Cooldown;
const guild_role_interval = {}; global.guild_role_interval = guild_role_interval;
const guild_stats_interval = {}; global.guild_stats_interval = guild_stats_interval;

// -> Maintenance mode
const Maintenance_Enabled = 0; global.Maintenance_Enabled = Maintenance_Enabled;
const Maintenance_Reason = ""; global.Maintenance_Reason = Maintenance_Reason;
const Maintenance_Custom= {}; global.Maintenance_Custom = Maintenance_Custom;
const Status_MSG_ID = "856126006393176084"; global.Status_MSG_ID = Status_MSG_ID;
const Last_Response = 0; global.Last_Response = Last_Response;

// -> 8 ball game
const eight_ball_started = {}; global.eight_ball_started = eight_ball_started;
const mentions_mass_count = {}; global.mentions_mass_count = mentions_mass_count;