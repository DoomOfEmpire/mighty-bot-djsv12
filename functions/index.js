function LoadGuildVariables(guild_id) {
    con.query("SELECT * FROM guilds_settings WHERE guild_id = ?", [guild_id], function(err, result) {
        if(result != 0) {
        result[0].prefix == "null" ? GuildInfo.prefix[`${guild_id}`] = "mm!" : GuildInfo.prefix[`${guild_id}`] = result[0].prefix;
        }
    }); 
}
global.LoadGuildVariables = LoadGuildVariables;

function DeleteGuildVariables(guild_id) {
    delete GuildInfo.prefix[`${guild_id}`];
}
global.DeleteGuildVariables = DeleteGuildVariables;

function GenerateDate()
{
  var ziua = new Date().getDate();
    if(ziua < 10)
    {
      var strziua = "0"+ziua;
    }
    else
    {
      var strziua = ziua;
    }
    var luna = new Date().getMonth() + 1;
    if(luna < 10)
    {
      var strluna = "0"+luna;
    }
    else
    {
      var strluna = luna;
    }
    var an = new Date().getFullYear();
    var ora = new Date().getHours();
    if(ora < 10)
    {
      var strora = "0"+ora;
    }
    else
    {
      var strora = ora;
    }
    var minut = new Date().getMinutes();
    if(minut < 10)
    {
      var strminut = "0"+minut;
    }
    else
    {
      var strminut = minut;
    }
    var secunda = new Date().getSeconds();
    if(secunda < 10)
    {
      var strsecunda = "0"+secunda;
    }
    else
    {
      var strsecunda = secunda;
    }
    return `${strziua}/${strluna}/${an} ${strora}:${strminut}:${strsecunda}`
}
global.GenerateDate = GenerateDate;

function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second, " : " seconds") : "";
    return hDisplay + mDisplay + sDisplay; 
}
global.secondsToHms = secondsToHms;

function EditBOTSetting(setting, value)
{
  return con.query(`UPDATE settings SET ${setting}='${value}'`)
}
global.EditBOTSetting = EditBOTSetting;

function replaceAll(string, search, replace) {
  return string.split(search).join(replace);
}
global.replaceAll = replaceAll;

function formatSizeUnits(bytes) {
  if      (bytes>=1073741824) {bytes=(bytes/1073741824).toFixed(2)+' GB';}
  else if (bytes>=1048576)    {bytes=(bytes/1048576).toFixed(2)+' MB';}
  else if (bytes>=1024)       {bytes=(bytes/1024).toFixed(2)+' KB';}
  else if (bytes>1)           {bytes=bytes+' bytes';}
  else if (bytes==1)          {bytes=bytes+' byte';}
  else                        {bytes='0 byte';}
  return bytes;
}
global.formatSizeUnits = formatSizeUnits;

function validatedate(inputText) {
  var dateformat = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/;
  if(inputText.match(dateformat)) {
    var opera1 = inputText.split('/');
    var opera2 = inputText.split('-');
    lopera1 = opera1.length;
    lopera2 = opera2.length;
    if (lopera1>1) {
      var pdate = inputText.split('/');
    }
    else if (lopera2>1) {
      var pdate = inputText.split('-');
    }
    var dd = parseInt(pdate[0]);
    var mm  = parseInt(pdate[1]);
    var yy = parseInt(pdate[2]);
    // Create list of days of a month [assume there is no leap year by default]
    var ListofDays = [31,28,31,30,31,30,31,31,30,31,30,31];
    if (mm==1 || mm>2) {
      if (dd>ListofDays[mm-1]) {
        return false;
      }
      else {
        return true;
      }
    }
    else if (mm==2) {
      var lyear = false;
      if ( (!(yy % 4) && yy % 100) || !(yy % 400)) {
        lyear = true;
      }
      if ((lyear==false) && (dd>=29)) {
        return false;
      }
      else if ((lyear==true) && (dd>29)) {
        return false;
      }
      else return true;
    }
  }
  else {
    return false;
  }
}
global.validatedate = validatedate;

function SendToOwners(message) {
  bot.users.cache.get("510448696408670229").send(message); // Doom
  bot.users.cache.get("734731178610786316").send(message); // wiky
}
global.SendToOwners = SendToOwners;

function IsOwner(user_id) {
  if(
  user_id == "218808258205450240" // Doom
  || 
  user_id == "734731178610786316" // wiky
  ){
    return true;
  }
  else return false;
}
global.IsOwner = IsOwner;

function MuteUser(message, reason){
  con.query("SELECT * FROM guilds_settings WHERE guild_id = ?", [message.guild.id], function(err, result) {
    if(result != 0) {
      var secunde = result[0].spam_default_mute_minutes * 60
      var dailyget = Math.round(new Date() / 1000);
      var role = message.guild.roles.cache.find(role => role.name == "Muted");
      message.guild.channels.cache.forEach(async(c) => {
        await c.updateOverwrite(role, {
          SEND_MESSAGES: false,
          ADD_REACTIONS: false,
          SEND_TTS_MESSAGES: false,
          ATTACH_FILES: false,
          SPEAK: false
        });
      });
      
      var roles_array = [];
      message.member.roles.cache.forEach((role) => {
        roles_array.push(role.id);
      });

      message.member.roles.cache.forEach((role) => {
        message.member.roles.remove(role).catch(() => {});
      });
      message.member.roles.add(role);
      let embedmute = new Discord.MessageEmbed;
      embedmute.setAuthor(`${message.member.user.tag} has been muted by AdmBOT`, message.author.displayAvatarURL({dynamic : true})) 
      embedmute.setTitle(`Reason: ${reason}\nDuration: ${result[0].spam_default_mute_minutes} minutes`)
      embedmute.setColor('00FF00'); 
      message.channel.send(embedmute)
      con.query(`INSERT INTO mutes(user_id, mute_time, mute_date, mute_reason, mute_guild, roles_array) VALUES ('${message.member.user.id}','${dailyget + secunde}', '${GenerateDate()}', 'Spam', '${message.guild.id}', '${JSON.stringify(roles_array)}')`)
    }
  });
}
global.MuteUser = MuteUser;

function timeDiffCalc(dateFuture, dateNow, inJson=false) {
  let diffInMilliSeconds = Math.abs(dateFuture - dateNow) / 1000;

  // calculate days
  var days = Math.floor(diffInMilliSeconds / 86400);
  diffInMilliSeconds -= days * 86400;

  // calculate hours
  var hours = Math.floor(diffInMilliSeconds / 3600) % 24;
  diffInMilliSeconds -= hours * 3600;

  // calculate minutes
  var minutes = Math.floor(diffInMilliSeconds / 60) % 60;
  diffInMilliSeconds -= minutes * 60;

  // calculate seconds
  var seconds = Math.trunc(diffInMilliSeconds);

  var difference = "";
  var difference_type = {};

  difference_type.seconds = seconds;
  difference_type.minute = minutes;
  difference_type.hours = hours;
  difference_type.days = days;

  if(minutes == 0) {
      difference = `${seconds} seconds`;
  }
  else if(hours == 0) {
      difference = `${minutes} minutes and ${seconds} seconds`;
  }
  else {
      difference = `${hours} hours, ${minutes} minutes and ${seconds} seconds`;
  }

  if(inJson == false) {
    return difference;
  }
  else {
    return difference_type;
  }
}
global.timeDiffCalc = timeDiffCalc;

function GetUserRowFromThisGuild(guild_id, user_id, row, callback){
  con.query("SELECT * FROM users_data WHERE guild_id = ? AND user_id = ?", [guild_id, user_id], function(err, result){
    if(result != 0){
      if(row == "whitelist" && IsOwner(user_id)) return callback(1);
      else return eval(`callback(result[0].${row})`);
    }
    else return callback(0);
  });
}
global.GetUserRowFromThisGuild = GetUserRowFromThisGuild;

function UpdateUserFromThisGuild(guild_id, user_id, row, value){
  con.query("SELECT * FROM users_data WHERE guild_id = ? AND user_id = ?", [guild_id, user_id], function(err, result){
    if(result != 0){
      con.query(`UPDATE users_data SET ${row} = ? WHERE guild_id = ? AND user_id = ?`, [value, guild_id, user_id]);
    }
  });
}
global.UpdateUserFromThisGuild = UpdateUserFromThisGuild;

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
global.numberWithCommas = numberWithCommas;

function UpdateUser(user_id, row, value){
  con.query("SELECT * FROM users WHERE user_id = ?", [user_id], function(err, result){
    if(result != 0){
      con.query(`UPDATE users SET ${row} = ? WHERE user_id = ?`, [value, user_id]);
    }
  });
}
global.UpdateUser = UpdateUser;

function GetTotalMessagesInGuild(guild_id, callback){
  con.query("SELECT * FROM users_data WHERE guild_id = ? AND total_message_send > ?", [guild_id, 0], function(err, result){
    if(result != 0){
      var total_messages = 0;
      for(var i = 0; i < result.length; i++){
        total_messages += result[i].total_message_send;
      }
      return callback(total_messages);
    }
    else return callback(0);
  });
}
global.GetTotalMessagesInGuild = GetTotalMessagesInGuild;

function CreateUserIfNotExistInSpecificGuild(user_id, guild_id){
  con.query("SELECT * FROM users_data WHERE user_id = ? AND guild_id = ?", [user_id, guild_id], function(err, result){
    if(result == 0){
      con.query("INSERT INTO users_data (guild_id, user_id) VALUES(?, ?)", [guild_id, user_id]);
    }
  });
}
global.CreateUserIfNotExistInSpecificGuild = CreateUserIfNotExistInSpecificGuild;

function CreateUserIfNotExist(user_id){
  con.query("SELECT * FROM users WHERE user_id = ?", [user_id], function(err, result){
    if(result == 0){
      con.query("INSERT INTO users (user_id) VALUES(?)", [user_id]);
    }
  }); 
}
global.CreateUserIfNotExist = CreateUserIfNotExist;

function DeleteUsersIfExistsInSpecificGuild(user_id, guild_id){
  con.query("SELECT * FROM users_data WHERE user_id = ? AND guild_id = ?", [user_id, guild_id], function(err, result){
    if(result != 0){
      con.query("DELETE FROM users_data WHERE user_id = ? AND guild_id = ?", [user_id, guild_id]);
    }
  });
}
global.DeleteUsersIfExistsInSpecificGuild = DeleteUsersIfExistsInSpecificGuild;

function emojiUnicode (emoji) {
  var comp;
  if (emoji.length === 1) {
      comp = emoji.charCodeAt(0);
  }
  comp = (
      (emoji.charCodeAt(0) - 0xD800) * 0x400
    + (emoji.charCodeAt(1) - 0xDC00) + 0x10000
  );
  if (comp < 0) {
      comp = emoji.charCodeAt(0);
  }
  return comp.toString("16");
};
global.emojiUnicode = emojiUnicode;

function RandomWordsFor8Ball(){
    var rand = Math.floor(Math.random() * 5);
    var return_value;
    switch(rand){
      case 0: return_value = "Yes"; break;
      case 1: return_value = "No"; break;
      case 2: return_value = "Maybe"; break;
      case 3: return_value = "Probably"; break;
      case 4: return_value = "Idk"; break;
    }
    return return_value;
}
global.RandomWordsFor8Ball = RandomWordsFor8Ball;

function CheckRoleCounter(guild_id) {
    var guild = bot.guilds.cache.get(guild_id);
    if(guild) {
      GetGuildSettings(guild_id, "role_counter", function(category) {
        if(category != 0) {
          category = guild.channels.cache.get(category);
          con.query("SELECT * FROM role_counter WHERE guild_id = ?", [guild_id], function(err, result) {
            if(result != 0) {
              for(var i = 0; i < result.length; i++) {
                var role = guild.roles.cache.get(result[i].role_id);
                if(role){
                  category.children.forEach(channel => {
                    var c_name = `${channel.name}`.toLowerCase();
                    var r_name = `${role.name}`.toLowerCase();
                    if(`${c_name}`.includes(`${r_name}`)){
                      channel.setName(`${role.name}: ${guild.members.cache.filter(m => m.roles.cache.has(role.id)).size}`);
                    }
                  });
                }
                else{
                  con.query("DELETE FROM role_counter WHERE guild_id = ? AND role_id = ?", [guild_id, result[i].role_id]);
                }
              }
            }
          });
        }
      });
      if(guild_role_interval[guild_id]){
        clearInterval(guild_role_interval[guild_id]);
        delete guild_role_interval[guild_id];
      }
      guild_role_interval[guild_id] = setInterval(() => {
        CheckRoleCounter(guild_id);
      }, 300000);
    }
    else{
      if(guild_role_interval[guild_id]){
        clearInterval(guild_role_interval[guild_id]);
        delete guild_role_interval[guild_id];
      }
      con.query("DELETE FROM role_counter WHERE guild_id = ?", [guild_id]);
    }
}
global.CheckRoleCounter = CheckRoleCounter;
  
function EnableRoleCounterFor(guild_id, role_id) {
    con.query("INSERT INTO role_counter (guild_id, role_id) VALUES(?, ?)", [guild_id, role_id]);
    CheckRoleCounter(guild_id);
    con.query("SELECT * FROM role_counter WHERE guild_id = ?", [guild_id], function(err, result) {
      if(result != 0){
        if(result.length == 1){
          bot.guilds.cache.get(guild_id).channels.create("Role Counter", {
            type: "category",
            position: 0
          }).then((c) => {
            UpdateGuildSettings(guild_id, "role_counter", c.id);
            EnableRoleCounterToThisCategory(guild_id, role_id, c.id);
          });
        }
        else {
          GetGuildSettings(guild_id, "role_counter", function(result) {
            if(result != 0) {
              EnableRoleCounterToThisCategory(guild_id, role_id, result);
            }
          });
        }
      }
    });
}
global.EnableRoleCounterFor = EnableRoleCounterFor;
  
function EnableRoleCounterToThisCategory(guild_id, role_id, category_id){
    var guild = bot.guilds.cache.get(guild_id);
    if(guild){
      guild.channels.create(`${guild.roles.cache.get(role_id).name}: ${guild.members.cache.filter(m => m.roles.cache.has(role_id)).size}`, {
        parent: category_id,
        type: "voice"
      });
    }
}
global.EnableRoleCounterToThisCategory = EnableRoleCounterToThisCategory;

function DisableRoleCounterFromThisCategory(guild_id, role_id, category_id) {
    var guild = bot.guilds.cache.get(guild_id);
    var category = bot.channels.cache.get(category_id);
    if(guild && category){
      var role = guild.roles.cache.get(role_id);
      if(role){
        var count = 0;
        category.children.forEach(channel => {
          count++;
          var c_name = `${channel.name}`.toLowerCase();
          var r_name = `${role.name}`.toLowerCase();
          if(`${c_name}`.includes(`${r_name}`)){
            channel.delete();
            con.query("DELETE FROM role_counter WHERE guild_id = ? AND role_id = ?", [guild_id, role.id]);
          }
        });
        if(count == 1){
          category.delete();
          UpdateGuildSettings(guild_id, "role_counter", "0");
        }
      }
    }
}
global.DisableRoleCounterFromThisCategory = DisableRoleCounterFromThisCategory;

function CheckingGuildCounter(guild_id){
    con.query("SELECT * FROM guilds_settings WHERE guild_id = ?", [guild_id], function(err, result) {
    if(result != 0){
      var guild = bot.guilds.cache.get(guild_id);
      var category;
      if(guild) category = bot.channels.cache.get(result[0].server_stats);
      if(guild && category){
        var count = 0;
        var channels = {};
        category.children.forEach(channel => {
          count++;
          channels[count] = channel;
        });
  
        if(count != 0) {
          for(var i = 1; i <= count; i++) {
            if(`${channels[i].name}`.includes(`members`)) {
              CheckChannelType(1, channels[i]);
            }
            if(`${channels[i].name}`.includes("bots")) {
              CheckChannelType(2, channels[i]);
            }
            if(`${channels[i].name}`.includes("🟢") || `${channels[i].name}`.includes("⛔") || `${channels[i].name}`.includes("🌙")) {
              CheckChannelType(3, channels[i]);
            }
          }
        }
        else {
          CreateChannelsCountForThisCategory(result[0].server_stats);
        }
  
        function CheckChannelType(type, channel){
          switch(type){
            case 1:{
              guild.channels.cache.get(channel.id).setName(`Members: ${guild.members.cache.size}`);
              break;
            }
            case 2:{
              guild.channels.cache.get(channel.id).setName(`Bots: ${guild.members.cache.filter(member => member.user.bot).size}`);
              break;
            }
            case 3:{
              guild.channels.cache.get(channel.id).setName(`🟢 ${guild.members.cache.filter(member => member.presence.status == "online").size} ⛔ ${guild.members.cache.filter(member => member.presence.status == "dnd").size} 🌙 ${guild.members.cache.filter(member => member.presence.status == "idle").size}`);
              break;
            }
          }
        }
  
        function CreateChannelsCountForThisCategory(category_id){
          guild.channels.create(`Members: ${guild.members.cache.size}`, {
            parent: category_id,
            type: "voice"
          });
          guild.channels.create(`Bots: ${guild.members.cache.filter(member => member.user.bot).size}`, {
            parent: category_id,
            type: "voice"
          });
          guild.channels.create(`🟢 ${guild.members.cache.filter(member => member.presence.status == "online").size} ⛔ ${guild.members.cache.filter(member => member.presence.status == "dnd").size} 🌙 ${guild.members.cache.filter(member => member.presence.status == "idle").size}`, {
            parent: category_id,
            type: "voice"
          });
          guild.channels.create("")
        }
  
        if(guild_stats_interval[guild_id]) {
          clearInterval(guild_stats_interval[guild_id]);
          delete guild_stats_interval[guild_id];
        }
        guild_stats_interval[guild_id] = setInterval(() => {
          CheckingGuildCounter(guild_id);
        }, 300000);
      }
      else {
        if(guild_stats_interval[guild_id]) {
          clearInterval(guild_stats_interval[guild_id]);
          delete guild_stats_interval[guild_id];
        }
      }
     }
    });
}
global.CheckingGuildCounter = CheckingGuildCounter;

function DeleteChannelsFromCounterCategory(guild_id, category_id) {
    var category = bot.guilds.cache.get(guild_id).channels.cache.get(category_id);
    if(category) {
      category.children.forEach(channel => {
        channel.delete();
      });
    }
    category.delete();
}
global.DeleteChannelsFromCounterCategory = DeleteChannelsFromCounterCategory;

function TimestampConvert(timestamp) {
    var milliseconds = timestamp * 1000;
    var d = new Date(milliseconds);
    var time = d.toLocaleTimeString('en-US')
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var monthName = months[d.getMonth()];
    var dateObject = `${monthName} ${moment.utc(d).format("DD")}, ${moment.utc(d).format("YYYY")} at ${time}`;
    return dateObject;
}
global.TimestampConvert = TimestampConvert;

function CreateGuildSettingsIfDontHave(guild_id) {
    try {
      con.query("SELECT * FROM guilds_settings WHERE guild_id = ?", [guild_id], function(err, result) {
        if(result == 0) {
          con.query("INSERT INTO guilds_settings (guild_id) VALUES(?)", [guild_id]);
          setTimeout(() => {
            LoadGuildVariables(guild_id);
          }, 1500);
        }
      });
    }
    catch(e) {
      console.log(e.stack);
    }
}
global.CreateGuildSettingsIfDontHave = CreateGuildSettingsIfDontHave;

function GetGuildSettings(guild_id, row, callback) {
    con.query(`SELECT * FROM guilds_settings WHERE guild_id = ?`, [guild_id], function(err, result) {
      if(result != 0) {
        eval(`callback(result[0].${row});`);
      }
    });
}
global.GetGuildSettings = GetGuildSettings;

function UpdateSettings(row, value){
    con.query(`UPDATE settings SET ${row} = ?`, [value]);
}
global.UpdateSettings = UpdateSettings;

function UpdateGuildSettings(guild_id, row, value) {
      con.query(`UPDATE guilds_settings SET ${row} = ? WHERE guild_id = ?`, [value, guild_id]);
}
global.UpdateGuildSettings = UpdateGuildSettings;

function LogChannelSend(text)
{
    let logchannel = bot.channels.cache.get('825309704275099649')
    return logchannel.send("```" + "\n" + text + "```");
}
global.LogChannelSend = LogChannelSend;

function UsageChannelSend(text)
{
    let logchannel = bot.channels.cache.get('992800092291600434')
    return logchannel.send("```" + "\n" + text + "```");
}
global.UsageChannelSend = UsageChannelSend;

function isNumber(str) {
    if (typeof str != "string") return false 
    return !isNaN(str) && !isNaN(parseFloat(str))
}
global.isNumber = isNumber;

function EditRoleFunction(message,msg,color,r,role_color_string){
    for(var i = 1; i <= 10; i++) {
      msg.react(reaction_numbers[i]);
    }
    const filter = (reaction, user) => {
      var string = '';
      for(var i = 1; i <= 10; i++) {
        if(i == 1) string = `'${reaction_numbers[i]}'`;
        else if(i >= 2) string += `, '${reaction_numbers[i]}'`;
      }
      return eval(`[${string}].includes(reaction.emoji.name) && user.id === message.author.id`);
    };
    msg.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] }).then(collected => {
      const reaction = collected.first(); 
      msg.reactions.removeAll().catch(() => {})
  
      var permissions = {};
      permissions[1] = "ADMINISTRATOR";
      permissions[2] = "ADD_REACTIONS";
      permissions[3] = "ATTACH_FILES";
      permissions[4] = "BAN_MEMBERS";
      permissions[5] = "CHANGE_NICKNAME";
      permissions[6] = "CONNECT";
      permissions[7] = "CREATE_INSTANT_INVITE";
      permissions[8] = "DEAFEN_MEMBERS";
      permissions[9] = "EMBED_LINKS";
      permissions[10] = "KICK_MEMBERS";
  
      for(var i = 1; i <= 10; i++) {
        if(reaction.emoji.name == reaction_numbers[i]) {
          var embed = new Discord.MessageEmbed();
          embed.setDescription(`New role created: **${r.name}** with color: **${role_color_string[1]}**\nPermission: **${permissions[i]}**\nIf you want to edit again use: **mm!editrole [Name]**`);
          embed.setColor('#'+color);
          msg.edit(embed); 
          r.setPermissions(permissions[i]);
        }
      }
    })
    .catch(console.log);
}
global.EditRoleFunction = EditRoleFunction;

function attachIsImage(msgAttach) {
    var url = msgAttach.url;
    return url.indexOf("png", url.length - "png".length /*or 3*/) !== -1 || url.indexOf("jpg", url.length - "jpg".length /*or 3*/) !== -1;
}
global.attachIsImage = attachIsImage;
  
function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}
global.bytesToSize = bytesToSize;

async function PlaySound(type, message, url, seek=null, msg=null, jump=null, bass=0) {
    try {
      GuildInfo.MusicPlayer.current_music_type[`${message.guild.id}`] = type;

      switch(type) {
        case "youtube": {
          var stream;
          if(seek == null) {
              if(jump == null) GuildInfo.MusicPlayer.current[`${message.guild.id}`] += 1;
              else {
                  GuildInfo.MusicPlayer.current[`${message.guild.id}`] = jump;
                  if(msg != null) {
                      var embed = new Discord.MessageEmbed();
                      embed.setColor("RANDOM");
                      embed.setDescription(`Successfully jumped to: **${GuildInfo.MusicPlayer.list[`${message.guild.id}`][parseInt(jump)-1].title} [${jump}]**`);
                      msg.edit(embed);
                  }
              }
              stream = ytdl(url, { 
                  filter: "audioonly", 
                  opusEncoded: true, 
                  encoderArgs: ['-af', `bass=g=${bass},dynaudnorm=f=400`]
              });
          }
          else {
              stream = ytdl(url, { 
                  filter: "audioonly", 
                  opusEncoded: true, 
                  encoderArgs: ['-af', `bass=g=${bass},dynaudnorm=f=400`], 
                  seek: seek
              });
              
              if(msg != null) {
                  var embed = new Discord.MessageEmbed();
                  embed.setColor("RANDOM");
                  embed.setDescription(`Successfully seeked to seconds: ${seek}`);
                  msg.edit(embed);
              }
          }

          GuildInfo.MusicPlayer.start_time[`${message.guild.id}`] = Date.now();
          GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`] = GuildInfo.MusicPlayer.connection[`${message.guild.id}`].play(stream, { 
              type: "opus"
          }).on("finish", () => {
              if(GuildInfo.MusicPlayer.current[`${message.guild.id}`] != GuildInfo.MusicPlayer.list[`${message.guild.id}`].length) {
                  if(GuildInfo.MusicPlayer.loop_current_song[`${message.guild.id}`]) {
                      PlaySound("youtube", message, GuildInfo.MusicPlayer.list[`${message.guild.id}`][GuildInfo.MusicPlayer.current[`${message.guild.id}`]-1].url, null, null, GuildInfo.MusicPlayer.current[`${message.guild.id}`]);
                  }
                  else {
                      PlaySound("youtube", message, GuildInfo.MusicPlayer.list[`${message.guild.id}`][GuildInfo.MusicPlayer.current[`${message.guild.id}`]].url);
                  }
              }
              else {
                  if(GuildInfo.MusicPlayer.loop_current_song[`${message.guild.id}`]) {
                      PlaySound("youtube", message, GuildInfo.MusicPlayer.list[`${message.guild.id}`][GuildInfo.MusicPlayer.current[`${message.guild.id}`]-1].url, null, null, GuildInfo.MusicPlayer.current[`${message.guild.id}`]);
                  }
                  else if(GuildInfo.MusicPlayer.loop_current_queue[`${message.guild.id}`]) {
                      PlaySound("youtube", message, GuildInfo.MusicPlayer.list[`${message.guild.id}`][0].url, null, null, 1);
                  }
                  else {
                      ResetVoiceVariables(message.guild);
                      var embed = new Discord.MessageEmbed();
                      embed.setColor("RANDOM");
                      embed.setDescription("YouTube queue ended...");
                      message.channel.send(embed);
                      message.guild.me.voice.channel.leave();
                  }
              }
          });
          break;
        }
        case "spotify": {
          var stream;
          try {
            (async() => {
              spdl(url.url, {
                filter: "audioonly", 
                opusEncoded: true, 
                encoderArgs: ['-af', `dynaudnorm=f=400`]
              }).then(stream => {
                (async() => {
                    GuildInfo.MusicPlayer.connection[`${message.guild.id}`].play(stream, {
                      type: "opus"
                    }).on("start", () => {
                      var embed = new Discord.MessageEmbed();
                      embed.setTitle(`Now playing: ${url.title}`);
                      embed.setURL(url.url);
                      embed.setColor('#1DB954');
                      embed.addField('Artist', url.artist, true);
                      embed.setThumbnail(url.thumbnail);
                      message.channel.send(embed);
                    }).on("finish", () => {
                      ResetVoiceVariables(message.guild);
                      var embed = new Discord.MessageEmbed();
                      embed.setColor("RANDOM");
                      embed.setDescription("Spotify Queue ended...");
                      message.channel.send(embed);
                      message.guild.me.voice.channel.leave();
                    });
                })();
              });
            })();
          } catch (err) {
            console.error(err);
            message.reply(`An error occurred: ${err.message}`);
          }
          break;
        }
      }
    }
    catch(e) {
        console.log(e.stack);
    }
}
global.PlaySound = PlaySound;

function ResetVoiceVariables(guild) {
    // -> YouTube reset
    GuildInfo.MusicPlayer.current_music_type[`${guild.id}`] = null;
    GuildInfo.MusicPlayer.current[`${guild.id}`] = 0;
    GuildInfo.MusicPlayer.list[`${guild.id}`] = [];
    GuildInfo.MusicPlayer.song_connection[`${guild.id}`] = null;
    GuildInfo.MusicPlayer.connection[`${guild.id}`] = null;
    GuildInfo.MusicPlayer.paused[`${guild.id}`] = false;
    GuildInfo.MusicPlayer.loop_current_song[`${guild.id}`] = false;
    GuildInfo.MusicPlayer.loop_current_queue[`${guild.id}`] = false;
    GuildInfo.MusicPlayer.start_time[`${guild.id}`] = null;
    GuildInfo.MusicPlayer.search_list[`${guild.id}`] = [];
    if(GuildInfo.MusicPlayer.channel_check_interval[`${guild.id}`]) {
      clearInterval(GuildInfo.MusicPlayer.channel_check_interval[`${guild.id}`]);
    }
    GuildInfo.MusicPlayer.channel_check_interval[`${guild.id}`] = null;
}
global.ResetVoiceVariables = ResetVoiceVariables;

function GetPlayerURLBySearchMethods(guild, list) {
    var value = false;
    if(GuildInfo.MusicPlayer.search_list[`${guild.id}`][list-1]) {
        value = GuildInfo.MusicPlayer.search_list[`${guild.id}`][list-1].url;
    }
    return value;
}
global.GetPlayerURLBySearchMethods = GetPlayerURLBySearchMethods;

function LoadGuildVariables(guild) {
    // -> Music Player
    ResetVoiceVariables(guild);
}
global.LoadGuildVariables = LoadGuildVariables;