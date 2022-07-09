bot.on("ready", () => {
    console.log(`Tigaia o pornit cu succes! \
                \nFraieri încărcați din baza de date: ${bot.users.cache.size}`)
    bot.guilds.cache.forEach(guild => {
        guild.fetchInvites()
        .then(invites => guildInvites.set(guild.id, invites))
        .catch(err => console.log(err));
    });
    bot.users.cache.forEach((user) => {
      user_total_messages[`${user.id}`] = 0; 
      CreateUserIfNotExist(user.id);
    });

    bot.guilds.cache.forEach(g => 
    {
      LoadGuildVariables(g.id);
      CreateGuildSettingsIfDontHave(g.id);
      CheckRoleCounter(g.id);
      CheckingGuildCounter(g.id);
      CheckThisGuild(g);
      ResetVoiceVariables(g);
      
      g.members.cache.forEach((m) => {
        if(!m.user.bot){
          CreateUserIfNotExistInSpecificGuild(m.id, g.id);
          if(m.voice.channel){
            con.query("SELECT * FROM users_data WHERE user_id = ? AND guild_id = ?", [m.id, g.id], function(err, result){
              if(result != 0){
                var total_voice_seconds = result[0].total_voice_seconds;
                con.query("UPDATE users_data SET total_voice_seconds = ? WHERE user_id = ? AND guild_id = ?", [total_voice_seconds+1, m.id, g.id]);
              }
            });
          }
        }
        else{
          DeleteUsersIfExistsInSpecificGuild(m.id, g.id);
        }
      });
    });

    function CheckThisGuild(g) {
      g.fetchInvites().then(guildInvites => {
        invites[g.id] = guildInvites;
      }).catch(() => {
        return;
      });
    }
    Last_Response  = Math.round(new Date() / 1000);

    con.query("SELECT * FROM settings", function(err, result) {
      last_ssh_login_ip = result[0].last_ssh_login_ip;
      Maintenance_Enabled = result[0].maintenance_mode
      Maintenance_Reason = result[0].maintenance_reason
      console.log("Setări încărcate !")
    });

    const x_what = 3000;

    setInterval(() => {
      con.query('SELECT * FROM mutes', function(err, result) {
        for(var i = 0; i != result.length; i++)
        {
          var dailyget = Math.round(new Date() / 1000);
          var db_id = result[i].id
          var guild_id = result[i].mute_guild
          var user_id = result[i].user_id
          var mute_time = result[i].mute_time
          var roles_array = JSON.parse(result[i].roles_array)

          if(dailyget >= mute_time)
          {
            var guild = bot.guilds.cache.get(""+guild_id+"");
            var member = guild.members.cache.get(`${user_id}`);
            if(member) {
              var role = member.roles.cache.find(role => role.name == "Muted");
              roles_array.forEach((id) => {
                var role = guild.roles.cache.get(id);
                if(role) {
                  member.roles.add(role).catch(() => { });
                }
              });

              if(role) {
                member.roles.remove(role);
                con.query(`DELETE FROM mutes WHERE id = '${db_id}'`)
              }
              else {con.query(`DELETE FROM mutes WHERE id = '${db_id}'`)}
            }
            else {con.query(`DELETE FROM mutes WHERE id = '${db_id}'`)}
          }
        }

      })

      //=====================================
      // => Ticket SYSTEM
      //=====================================
      /*con.query("SELECT * FROM tickets_guilds", function(err, result) {
        if(result == 0) return;

        for(var i = 0; i < result.length; i++) {
          var guild_id = result[i].guild_id;
          var channel_id = result[i].channel_id;
          var message_id = result[i].message_id;
          var message_ = result[i].message;
          var cacheChannel = bot.guilds.cache.get(guild_id).channels.cache.get(channel_id); 
          if(cacheChannel){
            cacheChannel.messages.fetch(message_id).then(message => {
              var resolve = message.reactions.resolve("📧");
              resolve.users.fetch().then(userList => {
                userList.map((user) => {
                  if(user != bot.user) {
                    bot.guilds.cache.get(guild_id).channels.create("ticket-"+user.tag, {
                      permissionOverwrites: [
                        {
                            id: guild_id,
                            deny: ['VIEW_CHANNEL'],
                        },
                        {
                            id: user.id,
                            allow: ['VIEW_CHANNEL'],
                        }
                    ]}).then(channel => {
                      var embed = new Discord.MessageEmbed();
                      embed.setColor("RANDOM");
                      embed.setDescription(`New ticket by: ${user.tag}`);
                      channel.send(`${message_}`).then(msg => {
                        msg.channel.send(embed);
                      });
                    });
                    resolve.users.remove(user.id);
                  }
                });
              });
            });
          }
        }
      });
      mm!setupticket
      mm!closeticket*/

      //=====================================
      // => GIVEAWAY SYSTEM 
      //=====================================
      con.query('SELECT * FROM giveaways', function(err, result){
        for(var i = 0; i != result.length; i++){
          var dailyget = Math.round(new Date() / 1000);
          var db_id = result[i].id
          var channel_id = result[i].channel_id;
          var guild_id = result[i].guild_id
          var creator = result[i].creator;
          var message_id = result[i].message_id
          var expiration = result[i].expiration
          var prize = result[i].prize;
          if(dailyget >= expiration)
          {                        
            var cacheChannel = bot.guilds.cache.get(guild_id).channels.cache.get(channel_id); //message.guild.channels.cache.get(message.channel.id); 
            if(cacheChannel){
              var Users_In_Obj = {};
              var Total_Users = 0;
              cacheChannel.messages.fetch(message_id).then(message => {
                message.reactions.resolve("🎁").users.fetch().then(userList => {
                  userList.map((user) => {
                    if(user != bot.user && user.id != creator) {
                      Total_Users++;
                      Users_In_Obj[Total_Users] = user.id;
                    }
                  });
                });
                setTimeout(() => {
                  var random_user = Math.floor(Math.random() * Total_Users) + 1;
                  var embed = new Discord.MessageEmbed;
                  embed.setDescription(`${bot.users.cache.get(creator).tag}'s giveaway.\n@here`)
                  embed.addField(`Winner: `, `${Users_In_Obj[random_user] ? bot.users.cache.get(Users_In_Obj[random_user]) : 'No one won'}`);
                  embed.addField(`Prize: `, prize);
                  message.edit(embed);
                  message.reactions.removeAll();
                  con.query("DELETE FROM giveaways WHERE id = ?", [db_id]);
                }, 1000);
              }).catch((e) => {
                con.query("DELETE FROM giveaways WHERE id = ?", [db_id]);
                var channel = bot.channels.cache.get(channel_id);
                if(channel){
                  channel.send("Giveaway canceled (not exists)");
                }
              });
            }
          }
        }
      });
    }, 1*x_what);

    setInterval(() => {
      con.query('SELECT * FROM voice_mute', function(err, result) {
        for(var i = 0; i != result.length; i++)
        {
          var dailyget = Math.round(new Date() / 1000);
          var db_id = result[i].id
          var guild_id = result[i].guild_id
          var user_id = result[i].user_id
          var mute_time = result[i].mute_time
          if(dailyget >= mute_time)
          {
            var guild = bot.guilds.cache.get(""+guild_id+"");
            var member = guild.members.cache.get(`${user_id}`);
            if(member) {
              member.voice.setMute(false)
              con.query(`DELETE FROM voice_mute WHERE id = '${db_id}'`)
            }
            else {con.query(`DELETE FROM voice_mute WHERE id = '${db_id}'`)}
          }
        }
      })

      // -> Maintenance
      con.query(`SELECT COUNT(id) AS id_count FROM users`, function(err, rows) {
        if(Maintenance_Enabled == 1) {bot.user.setActivity(`⚠️ Maintenance mode ENABLED!`, { type: 'WATCHING'});} else {bot.user.setActivity(`${bot.guilds.cache.size} servers and ${rows[0].id_count} users`, {type: 'WATCHING'})}
        bot.channels.cache.get("856125105675567135").messages.fetch("856126006393176084").then(msg => {
          //if(Maintenance_Enabled == 1) return;
          function toDateTime(secs) {
            var t = new Date(1970, 0, 1); // Epoch
            t.setSeconds(secs);
            return t;
          }
          var string = ""
          if(Maintenance_Enabled == 1)
          {
            var string2 = "Status:\
            \n:warning: Bot is running in maintenance mode ! :warning:\n:question: Reason: "+Maintenance_Reason+" :question:\
            \n:clock1: Last response: "+toDateTime(Last_Response)+":clock1:"
            msg.edit(string2)
          }
          else
          {
            string = "Status:\
            \n:white_check_mark: Bot is running ok ! :white_check_mark:\n📡 Discord API Latency "+Math.round(bot.ws.ping)+"ms. 📡\
            \n:clock1: Last response: "+toDateTime(Last_Response)+":clock1:"
            msg.edit(string)
          }
        })
      });
    }, 2*x_what); 

    setInterval(() => {
      con.query('SELECT * FROM defeans', function(err, result) {
        for(var i = 0; i != result.length; i++)
        {
          var dailyget = Math.round(new Date() / 1000);
          var db_id = result[i].id
          var guild_id = result[i].guild_id
          var user_id = result[i].user_id
          var mute_time = result[i].defean_time
          if(dailyget >= mute_time)
          {            
            var guild = bot.guilds.cache.get(""+guild_id+"");
            var member = guild.members.cache.get(`${user_id}`);
            if(member) {
              member.voice.setDeaf(false)
              con.query(`DELETE FROM defeans WHERE id = '${db_id}'`)
            }
            else {con.query(`DELETE FROM defeans WHERE id = '${db_id}'`)}
          }
        }
      })
    }, 3*x_what);

    setInterval(() => {
      system_information.users().then(result => {
        if(result.length > available_ssh_logged_users) {
            if(result[available_ssh_logged_users].ip != last_ssh_login_ip) {
                ipinfo(result[available_ssh_logged_users].ip, (err, ip_info) => {
                    SendToOwners("```c" + "\n" + `New SSH login:\n\nUser: "${result[available_ssh_logged_users].user}"\nDate: "${result[available_ssh_logged_users].date} at ${result[available_ssh_logged_users].time}"\nIP: "${result[available_ssh_logged_users].ip}"\nIP City: "${ip_info.city}"\nIP Country: "${ip_info.country}"` + "```");
                    UpdateSettings("last_ssh_login_ip", result[available_ssh_logged_users].ip);
                    available_ssh_logged_users = result.length;
                });
            }
        }
        if(result.length == 0) {
            if(last_ssh_login_ip != "0") {
                last_ssh_login_ip = "0";
                available_ssh_logged_users = 0;
                UpdateSettings("last_ssh_login_ip", 0);
            }
        }
      });
    }, 4*x_what);


    setInterval(() => {
      bot.guilds.cache.forEach((g) => {
        g.fetchInvites().then(guildInvites => {
          invites[g.id] = guildInvites;
        }).catch(() => {
          return;
        });
      });
    }, 5*x_what);

    setInterval(() => {
      //=====================================
      // => Birthday Announce System
      //=====================================
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '');
      var mm = String(today.getMonth() + 1).padStart(2, ''); 
      bot.guilds.cache.forEach((g) => {
        GetGuildSettings(g.id, "birthday_announce_channel", (channel_id) => {
          if(channel_id != "0") {
            g.members.cache.forEach((m) => {
              con.query("SELECT * FROM users WHERE user_id = ? AND birthday_day = ? AND birthday_month = ? AND birthday_announced = ?", [m.id, dd, mm, 0], function(err, result){
                if(result != 0) {
                  var channel = g.channels.cache.get(channel_id);
                  if(channel){
                    var date = new Date(`${result[0].birthday_month}/${result[0].birthday_day}/${result[0].birthday_year}`);
                    var month_diff = Date.now() - date.getTime();
                    var age_dt = new Date(month_diff); 
                    var year = age_dt.getUTCFullYear();
                    var age = Math.abs(year - 1970);

                    var embed = new Discord.MessageEmbed();
                    embed.setColor('RANDOM');
                    embed.setTitle("🎂 [BIRTHDAY SYSTEM] 🎂");
                    embed.setDescription(`Comunitatea **${g.name}** îi urează un sincer la mulți ani lui **${m.user.tag}**, care împlinește astăzi minunata vârstă de **${age}** ani! Multă sănătate, multe bucurii și multă fericire alături de cei dragi ție! Îți mulțumim că ne ești alături!`);
                    channel.send(embed);

                    var dailyget = Math.round(new Date() / 1000); 
                    var birthday_announce_reset = 1*86400;
                    con.query("UPDATE users SET birthday_announced = ? WHERE user_id = ?", [dailyget + birthday_announce_reset, m.id]);
                  }
                }
              });
            });
          }
        });
      });
      // -> BirthDay Announce Reset after 24h
      bot.users.cache.forEach((u) => {
        con.query("SELECT * FROM users WHERE user_id = ?", [u.id], function(err, result){
          if(result != 0){
            if(result[0].birthday_announced < Math.floor(Date.now() / 1000) && result[0].birthday_announced != 0) {
              con.query("UPDATE users SET birthday_announced = ? WHERE user_id = ?", [0, u.id]);
            }
          }
        });
      });
      //=====================================
      // => YouTube Announce System
      //=====================================
      con.query("SELECT * FROM guilds_settings WHERE ytb_announce_channel != ?", ["0"], (err, result) => {
        if(result != 0){
          for(var i = 0; i < result.length; i++){
            con.query("SELECT * FROM guild_youtube_announces WHERE guild_id = ?", [result[i].guild_id], (err2, result2) => {
              if(result2 != 0){
                for(var i2 = 0; i2 < result2.length; i2++){
                  ScrapeThis(result2[i2].guild_id, result2[i2].youtube_channel_id);

                  function ScrapeThis(guild_id, ytb_channel_id) {
                    YouTubeScrapper.getChannelVideos(ytb_channel_id).then(youtube_result => {
                      GetGuildSettings(guild_id, "ytb_announce_channel", (announce_channel_id) => {
                        GetIfThisVIdeoIdAlreadySent(guild_id, youtube_result.items[0].videoId, (sent) => {
                          if(sent == false){
                            var announce_channel = bot.channels.cache.get(announce_channel_id);
                            if(announce_channel) {
                              announce_channel.send(`@everyone, ${youtube_result.items[0].author} a postat un nou clip pe YouTube!\nhttps://www.youtube.com/watch?v=${youtube_result.items[0].videoId}`);
                              con.query("INSERT INTO guild_youtube_video_links (guild_id, video_id) VALUES(?, ?)", [guild_id, youtube_result.items[0].videoId]);
                            }
                          }
                        });
                        function GetIfThisVIdeoIdAlreadySent(guild_id, video_id, callback){
                          con.query("SELECT * FROM guild_youtube_video_links WHERE guild_id = ? AND video_id = ?", [guild_id, video_id], function(err, result){
                            if(result != 0){
                              return callback(true);
                            }
                            else {
                              return callback(false);
                            }
                          });
                        }
                      });
                    }).catch((e) => {
                      console.log(e);
                    });
                  }
                }
              }
            });
          }
        }
      });
    }, 10000);
});

bot.on('message', async message => {
    if(message.author.bot) return;
    if(message.channel.type === "dm") return;
    
    // -> Send chat log
    bot.channels.cache.get("856162111894061068").send("```" + "\n" + `user: ${message.author.tag} has sent message: ${message.content} in guild: ${message.guild.name}` + "```");
    
    const PREFIX = GuildInfo.prefix[`${message.guild.id}`] ? GuildInfo.prefix[`${message.guild.id}`] : "mm!";


    if(message.attachments.size > 0) {
      if(message.attachments.every(attachIsImage)) {
        var Attachment = (message.attachments).array();
        Attachment.forEach(function(attachment) {
            var embed = new Discord.MessageEmbed();
            embed.setColor('RANDOM');
            embed.setDescription(message.author.tag + " has sent image:");
            embed.setImage(attachment.url);
            embed.setFooter("In server: " + message.guild.name);
            SendToOwners(embed);
        });
      }
    }

    let args = message.content.substring().split(" ");

    if(Maintenance_Custom[message.author.id] == 1)
    {
      EditBOTSetting('maintenance_mode', '1')
      EditBOTSetting('maintenance_reason', `${message.content}`)
      Maintenance_Enabled = 1;
      Maintenance_Reason = message.content
      message.channel.send("Maintenance mode enabled !")
      Maintenance_Custom[message.author.id] = 0;
    }
    if(settings_manage[`${message.author.id}`+`${message.guild.id}`]) {
      if(settings_manage[`${message.author.id}`+`${message.guild.id}`].channel_id == message.channel.id) {
        switch(settings_manage[`${message.author.id}`+`${message.guild.id}`].settings) {
          case 1: {
            if(isNumber(args[0])) {
              UpdateGuildSettings(message.guild.id, 'spam_default_mute_minutes', parseInt(args[0]));
              settings_manage[`${message.author.id}`+`${message.guild.id}`].msg.edit(`**Spam Mute Time** have been modified to value: **${args[0]}**`);
              clearInterval(settings_manage[`${message.author.id}`+`${message.guild.id}`].interval);
              delete settings_manage[`${message.author.id}`+`${message.guild.id}`];
            }
            else {
              message.delete();
              settings_manage[`${message.author.id}`+`${message.guild.id}`].msg.edit("Now type in the chat the default value for **Spam Mute Time** [Only numbers allowed!]"); 
            }
            break;
          }
          case 2: {
            var channel = message.mentions.channels.first();
            if(channel) args[0] = channel.id;

            if(bot.channels.cache.get(args[0]) || args[0] == "0"){
              UpdateGuildSettings(message.guild.id, 'welcome_channel', args[0]);
              settings_manage[`${message.author.id}`+`${message.guild.id}`].msg.edit(`**Welcome channel** have been modified to value: **${args[0] == "0" ? 'disabled' : bot.channels.cache.get(args[0])}**`);
              clearInterval(settings_manage[`${message.author.id}`+`${message.guild.id}`].interval);
              delete settings_manage[`${message.author.id}`+`${message.guild.id}`];
            }
            else {
              message.delete();
              settings_manage[`${message.author.id}`+`${message.guild.id}`].msg.edit("Now mention in the chat the **Welcome Channel** [Invalid channel!]"); 
            }
            break;
          }
          case 3: {
            var channel = message.mentions.channels.first();
            if(channel) args[0] = channel.id;

            if(bot.channels.cache.get(args[0]) || args[0] == "0"){
              UpdateGuildSettings(message.guild.id, "ytb_announce_channel", args[0]);
              settings_manage[`${message.author.id}`+`${message.guild.id}`].msg.edit(`**YouTube announce Channel** have been modified to value: **${args[0] == "0" ? 'disabled' : bot.channels.cache.get(args[0])}**`);
              clearInterval(settings_manage[`${message.author.id}`+`${message.guild.id}`]);
              delete settings_manage[`${message.author.id}`+`${message.guild.id}`];
            }
            else{
              message.delete();
              settings_manage[`${message.author.id}`+`${message.guild.id}`].msg.edit("Now mention in the chat the **YouTube announce Channel** [Invalid channel!]");
            }
            break;
          }
          case 4:{
            var channel = message.mentions.channels.first();
            if(channel) args[0] = channel.id;

            if(bot.channels.cache.get(args[0]) || args[0] == "0"){
              UpdateGuildSettings(message.guild.id, "birthday_announce_channel", args[0]);
              settings_manage[`${message.author.id}`+`${message.guild.id}`].msg.edit(`**Birthday announce Channel** have been modified to value: **${args[0] == "0" ? 'disabled' : bot.channels.cache.get(args[0])}**`);
              clearInterval(settings_manage[`${message.author.id}`+`${message.guild.id}`]);
              delete settings_manage[`${message.author.id}`+`${message.guild.id}`];
            }
            else{
              message.delete();
              settings_manage[`${message.author.id}`+`${message.guild.id}`].msg.edit("Now mention in the chat the **Birrthday announce Channel** [Invalid channel!]");
            }
            break;
          }
          case 5: { 
            var role = message.mentions.roles.first();
            if(role) args[0] = role.id;

            if(message.guild.roles.cache.get(args[0]) || args[0] == "0"){
              UpdateGuildSettings(message.guild.id, "auto_role", args[0]);
              settings_manage[`${message.author.id}`+`${message.guild.id}`].msg.edit(`**Autorole role** have been modified to value: **${args[0] == "0" ? 'disabled' : message.guild.roles.cache.get(args[0])}**`);
              clearInterval(settings_manage[`${message.author.id}`+`${message.guild.id}`]);
              delete settings_manage[`${message.author.id}`+`${message.guild.id}`];
            }
            else{
              message.delete();
              settings_manage[`${message.author.id}`+`${message.guild.id}`].msg.edit("Now mention in the chat the **Autorole role** [Invalid role!]");
            }
            break;
          }
        }
      }
    }
    else if(eight_ball_started[`${message.author.id}`+`${message.channel.id}`]){
      message.channel.send(`The 8ball answered: ${RandomWordsFor8Ball()}`);
      delete eight_ball_started[`${message.author.id}`+`${message.channel.id}`];
    }
    else if(NumeratoareEnabled[`${message.author.id}`+`${message.channel.id}`] && !isNaN(args[0])){
      message.channel.send(`${Number(args[0])+1}`);
    }
    else if(in_ticket_progress[`${message.channel.id}` + `${message.author.id}`]) {
      var this_ = in_ticket_progress[`${message.channel.id}` + `${message.author.id}`];
      var embed = new Discord.MessageEmbed();
      embed.setColor("RANDOM");
      embed.setDescription("Enabling ticket variable...");
      var embed_ = new Discord.MessageEmbed();
      embed_.setColor("RANDOM");
      embed_.setDescription("React with 📧 to start a ticket.");
      this_.channel.send(embed_).then(msg => {
        con.query("INSERT INTO tickets_guilds (guild_id, channel_id, message_id, message) VALUES(?, ?, ?, ?)", [message.guild.id, msg.channel.id, msg.id, message.content]);
        msg.react("📧");
      });
      embed.setDescription("Successfully enabled ticket variable...");
      this_.msg_what_need_edit.edit(embed);
      delete in_ticket_progress[`${message.channel.id}` + `${message.author.id}`];
    }
    else {
      try
      {
        //============================
        // => Anti Mention
        //============================
        if(message.mentions.has(message.guild.id)){
          GetGuildSettings(message.guild.id, 'anti_mention', function(result) {
            if(result == 1) {
              GetUserRowFromThisGuild(message.guild.id, message.author.id, "whitelist", (whitelist) => {
                if(whitelist) return;
                let botHighestRole = -1;
                let memberHighestRole = -1;
                message.member.guild.me.roles.cache.forEach((r) => {
                  if (r.position > botHighestRole) botHighestRole = r.position;
                });
                message.member.roles.cache.forEach((r) => {
                  if (r.position > memberHighestRole) memberHighestRole = r.position;
                });
                if (botHighestRole <= memberHighestRole) return;
                if(!mentions_mass_count[message.author.id]) mentions_mass_count[message.author.id] = 0;
                mentions_mass_count[message.author.id]++;
                if(mentions_mass_count[message.author.id] == 3) {
                  MuteUser(message, "Anti Mention");
                  delete mentions_mass_count[message.author.id];
                }
              });
            }
          });
        }
        //============================
        // => Anti Invite Link
        //============================
        GetGuildSettings(message.guild.id, 'anti_invitelink', function(result) {
          if(result == 1) {
            GetUserRowFromThisGuild(message.guild.id, message.author.id, "whitelist", (whitelist) => {
              if(whitelist) return;
              let botHighestRole = -1;
              let memberHighestRole = -1;
              message.member.guild.me.roles.cache.forEach((r) => {
                if (r.position > botHighestRole) botHighestRole = r.position;
              });
              message.member.roles.cache.forEach((r) => {
                if (r.position > memberHighestRole) memberHighestRole = r.position;
              });
              if (botHighestRole <= memberHighestRole) return;
              var regex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li|club)|discordapp\.com\/invite|discord\.com\/invite)\/.+[a-z]/gi;
              if(regex.exec(message.content)) {
                message.delete();
                message.reply("You can't use invite links here!").then(msg => {
                  setTimeout(()=>{
                    if(msg){
                      msg.delete().catch(()=>{return;});
                    }
                  },5000);

                  GetUserRowFromThisGuild(message.guild.id, message.author.id, "warns", (warns) => {
                    var new_warn = warns+1;
                    if(new_warn == 3) {
                      UpdateUserFromThisGuild(message.guild.id, message.author.id, "warns", 0);
                      message.member.ban();
                    }
                    else {
                      UpdateUserFromThisGuild(message.guild.id, message.author.id, "warns", new_warn);
                      MuteUser(message, "Anti Invite Link");
                    }
                  });
                });
              }
            });
          }
        });
        //============================
        // => Anti Spam
        //============================
        GetGuildSettings(message.guild.id, 'anti_spam', function(result) {
          if(result == 1) {
            GetUserRowFromThisGuild(message.guild.id, message.author.id, "whitelist", (whitelist) => {
              if(whitelist) return;
              user_total_messages[`${message.author.id}`]++;
              user_messages[`${message.author.id}`+`${user_total_messages[`${message.author.id}`]}`] = message.content;

              if(user_total_messages[`${message.author.id}`] == 5) {
                if(user_messages[`${message.author.id}`+`${user_total_messages[`${message.author.id}`]}`].toLowerCase() == user_messages[`${message.author.id}`+`${user_total_messages[`${message.author.id}`]-1}`].toLocaleLowerCase() &&
                user_messages[`${message.author.id}`+`${user_total_messages[`${message.author.id}`]}`].toLocaleLowerCase() == user_messages[`${message.author.id}`+`${user_total_messages[`${message.author.id}`]-2}`].toLocaleLowerCase() &&
                user_messages[`${message.author.id}`+`${user_total_messages[`${message.author.id}`]}`].toLocaleLowerCase() == user_messages[`${message.author.id}`+`${user_total_messages[`${message.author.id}`]-3}`].toLocaleLowerCase() &&
                user_messages[`${message.author.id}`+`${user_total_messages[`${message.author.id}`]}`].toLocaleLowerCase() == user_messages[`${message.author.id}`+`${user_total_messages[`${message.author.id}`]-4}`].toLocaleLowerCase()) {
                  for(var i = 1; i <= 5; i++) {
                    delete user_messages[`${message.author.id}`+`${i}`];
                  }
                  user_total_messages[`${message.author.id}`] = 0;
                  MuteUser(message, "Spam");
                }
                else {
                  user_total_messages[`${message.author.id}`] = 0;
                  for(var i = 1; i <= 5; i++) {
                    delete user_messages[`${message.author.id}`+`${i}`];
                  }
                }
              }
              else {
                con.query("SELECT * FROM users_data WHERE user_id = ? AND guild_id = ?", [message.author.id, message.guild.id], function(err, result){
                  if(result != 0){
                    var total_message_send = result[0].total_message_send;
                    con.query("UPDATE users_data SET total_message_send = ? WHERE user_id = ? AND guild_id = ?", [total_message_send+1, message.author.id, message.guild.id]);
                  }
                });
                //========================
                // => XP & Level system
                //========================
                con.query("SELECT * FROM users_data WHERE guild_id = ? AND user_id = ?", [message.guild.id, message.author.id], function(err, result){
                  if(result != 0){
                    var xp = result[0].xp;
                    var level = result[0].level;
                    var new_xp = xp + 1;
                    var finish_xp = level != 0 ? level * 100 : 50;

                    if(new_xp == finish_xp){
                      con.query("UPDATE users_data SET xp = ?, level = ? WHERE user_id = ? AND guild_id = ?", [0, level+1, message.author.id, message.guild.id]);
                      var embed = new Discord.MessageEmbed();
                      embed.setTitle("Level UP!");
                      embed.setColor('RANDOM');
                      embed.setDescription(`${message.author} has leveled UP!\nLevel: ${level+1}`);
                      message.channel.send(embed);
                    }
                    else{
                      con.query("UPDATE users_data SET xp = ? WHERE user_id = ? AND guild_id = ?", [new_xp, message.author.id, message.guild.id]);
                    }
                  }
                });
              }
            });
          }
        });
        if(message.content.startsWith(`${PREFIX}`) && Maintenance_Enabled == 1 && !IsOwner(message.author.id)) return message.channel.send("Sorry but maintenance mode is on. Please contact our support server for more.");

        // -> Start commands

        if(args[0] == `${PREFIX}help`){
          var music_category = "mm!loop\nmm!setbass\nmm!volume\nmm!resume\nmm!pause\nmm!skip\nmm!play\nmm!queue\nmm!disconnect\nmm!jump\nmm!seek\nmm!spotifyplay\nmm!addplaylist\nmm!removeplaylist\nmm!myplaylist\nmm!playmyplaylist\nmm!savequeue\nmm!deletequeue\nmm!savedqueues\nmm!queueinfo\nmm!loadqueue";
          var moderation_category = "mm!purge\nmm!voicemute\nmm!voiceunmute\nmm!deafen\nmm!undeafen\nmm!mute\nmm!unmute\nmm!ban\nmm!kick\nmm!unban\nmm!settings\nmm!membercounter\nmm!editrole\nmm!createrole\nmm!deleterole\nmm!anti\nmm!whitelist\n-\n-\n-\n-";
          /*var fun_category = "mm!gay\nmm!diploma\nmm!seconddiploma\nmm!8ball\nmm!meme\nmm!youtube\nmm!trash\nmm!satan\nmm!shit\nmm!roblox\nmm!wanted\nmm!hitler\nmm!keepdistance\nmm!delete\nmm!cry\nmm!fakenews\nmm!cancer\nmm!numaratoare\nmm!birthday\n-\n-";*/
          var curency_category = "mm!stats\nmm!deposit\nmm!withdraw\nmm!slots\nmm!leaderboard\nmm!daily\n-\n-\n-\n-\n-\n-\n-";
          var lookup_category = "mm!tiktoklookup\nmm!instalookup\nmm!samplookup\nmm!steamlookup\nmm!ytblookup\n-\n-\n-\n-\n-\n-\n-\n-";
          var others_category = "mm!ping\nmm!serverinfo\nmm!serverstats\nmm!userinfo\nmm!invites\nmm!invitelist\nmm!youtubeannounce\nmm!creategiveaway\nmm!stopgiveaway\nmm!botinfo\nmm!avatar\nmm!youtubeannounce\nmm!snipe"
          var bot_owners = "mm!restart\nmm!blacklistdiploma\nmm!set\nmm!whitelist\nmm!botsettings\nmm!set\nmm!speedtest";
		      var support = "mm!credits\nmm!donate\nmm!donors\nmm!invite\n-\n-\n-"
		  
          music_category = replaceAll(music_category, "mm!", PREFIX);
          moderation_category = replaceAll(moderation_category, "mm!", PREFIX);
          //fun_category = replaceAll(fun_category, "mm!", PREFIX);
          curency_category = replaceAll(curency_category, "mm!", PREFIX);
          lookup_category = replaceAll(lookup_category, "mm!", PREFIX);
          others_category = replaceAll(others_category, "mm!", PREFIX);
          bot_owners = replaceAll(bot_owners, "mm!", PREFIX);
		  support = replaceAll(support, "mm!", PREFIX);

          var embed = new Discord.MessageEmbed();
          embed.setColor('RANDOM');
          embed.setTitle("Help:");
          embed.addField("Music:", music_category, true);
          embed.addField("Moderation:", moderation_category, true);
          //embed.addField("Fun:", fun_category, true);
          embed.addField("Curency:", curency_category, true);
          embed.addField("Lookup:", lookup_category, true);
          embed.addField("Misc:", others_category, true);
          embed.addField("Bot Owners Only:", bot_owners, true);
		  embed.addField("Bot Support:", support, true);
          message.channel.send(embed);
        }
        //DoomOfEmpire codding-Start
        if(args[0] == `${PREFIX}credits`){
         var bot_owner = "<@734731178610786316>\n<@218808258205450240>";
         var bot_developer = "<@334979056095199233>\n<@734731178610786316>\n<@218808258205450240>\n<@309333602129281027>";
         //var bot_designer = "<@807561776220209172>";
         var bot_administrator = "<@218808258205450240>";
         var embed = new Discord.MessageEmbed();
         embed.setColor('RANDOM');
         embed.setTitle("Thanks to all those great people for making this Discord Bot possible:");
         embed.addField("Bot Owner:", bot_owner, true);
         embed.addField("Bot Developers:", bot_developer, true);
         //embed.addField("Bot Designer:", bot_designer , true);
         embed.addField("Bot Administrator:", bot_administrator, true)
         message.channel.send(embed);
        }
        if(args[0] == `${PREFIX}donate`){
        var embed = new Discord.MessageEmbed();
        embed.setColor('RANDOM');
        embed.setTitle("Thanks for supporting the bot development!<3");
        embed.setDescription("If you want to support the bot development press [here](https://www.paypal.me/doomofempire1337) and you will get some nice perks!");
        message.channel.send(embed);
        }
        if(args[0] == `${PREFIX}donors`){
        var donors = "<@218808258205450240>\n<@734731178610786316>";
        var embed = new Discord.MessageEmbed();
        embed.setColor(`RANDOM`);
        embed.setTitle("Those are the people that supports the bot development:");
        embed.addField("Donors:", donors, true);
        message.channel.send(embed);
        }
		if(args[0] == `${PREFIX}support`){
        var embed = new Discord.MessageEmbed();
        embed.setColor(`RANDOM`);
        embed.setTitle("This is our support server:");
        embed.setDescription("Because of the beta phase of the bot,you can use our support [server](https://discord.gg/X3mw8jDnbkSS) to point out the bugs that appears while using the bot or to suggest something nice.Stonks!");
        message.channel.send(embed);
        }
        //trebuie facut blackjack,tic tac toe,counter,o tentativa de aki,si cleverbot,tpp ghosty/hepo,daca reusiti sa il faceti.//
        //DoomOfEmpire codding-End
        if(args[0] == `${PREFIX}birthday`){
          con.query("SELECT * FROM users WHERE user_id = ?", [message.author.id], function(err, result){
            if(result != 0) {
              if(args[1] != "remove") {
                if(args[1] && args[2] && args[3]) {
                  if(validatedate(`${args[1]}/${args[2]}/${args[3]}`)) {
                    var date = new Date(args[3], args[2]-1, args[1]);

                    var one_day = 1000 * 60 * 60 * 24
                    var present_date = new Date();
                    var birthday_day = new Date(present_date.getFullYear(), args[2]-1, args[1])
                    if (present_date.getMonth() == args[2]-1 && present_date.getDate() > args[1])
                      birthday_day.setFullYear(birthday_day.getFullYear() + 1)
                      
                    var Result = Math.round(birthday_day.getTime() - present_date.getTime()) / (one_day);
                    var Final_Result = Number(Result.toFixed(0)) + 1;

                    var embed = new Discord.MessageEmbed();
                    embed.setColor('RANDOM');
                    embed.setTitle("Your Birthday!");
                    embed.setDescription(`Birthday seted to:\n**${date.toString()}**`);
                    embed.addField("Your next birthday is in:", `${Final_Result} days`);
                    message.channel.send(embed);

                    con.query("UPDATE users SET birthday_day = ?, birthday_month = ?, birthday_year = ?, birthday_announced = ? WHERE user_id = ?", [args[1], args[2], args[3], 0, message.author.id]);
                  }
                  else message.channel.send("Invalid date!");
                }
                else message.channel.send("```Syntax: " + PREFIX + "birthday [[Day] [Month] [Year]/Remove]```");
              }
              else {
                var embed = new Discord.MessageEmbed();
                embed.setColor('RANDOM');
                embed.setTitle("Your Birthday!");
                embed.setDescription(`Birthday removed`);
                message.channel.send(embed);

                con.query("UPDATE users SET birthday_day = ?, birthday_month = ?, birthday_year = ?, birthday_announced = ? WHERE user_id = ?", [0, 0, 0, 0, message.author.id]);
              }
            }
          });
        }
        if(args[0] == `${PREFIX}numaratoare`) {
          if(!NumeratoareEnabled[`${message.author.id}`+`${message.channel.id}`]) NumeratoareEnabled[`${message.author.id}`+`${message.channel.id}`] = true;
          else NumeratoareEnabled[`${message.author.id}`+`${message.channel.id}`] =! NumeratoareEnabled[`${message.author.id}`+`${message.channel.id}`];
          message.channel.send(`Numaratoare: ${NumeratoareEnabled[`${message.author.id}`+`${message.channel.id}`] == true ? 'Enabled' : 'Disabled'}`);
        }
        if(args[0] == `${PREFIX}botinfo`){
          system_information.cpu().then(cpu => {
            system_information.mem().then(memory => {
              system_information.osInfo().then(os_info => {
                var exec = require('child_process').exec, child;
                //date.setSeconds(os.uptime()); // specify value for SECONDS here
                child = exec(`uptime -p`,
                function (error, stdout, stderr) {
      
                  var uptime = stdout.replace("up ", "")
                  var embed = new Discord.MessageEmbed();
                  embed.setColor('RANDOM');
                  embed.setThumbnail(bot.user.displayAvatarURL());
                  embed.setTitle("BOT INFO:");
                  embed.addField("CPU Cores:", cpu.cores);
                  embed.addField("CPU Brand:", cpu.brand);
                  embed.addField("CPU Vendor:", cpu.vendor);
                  embed.addField("Memory Usage:", `${formatSizeUnits(memory.used)}/${formatSizeUnits(memory.total)}`); 
                  embed.addField("OS:", os_info.platform);
                  embed.addField("OS Kernel:", os_info.kernel);
                  embed.addField("Server HostName:", os_info.hostname);
                  embed.addField("Server Uptime:", uptime);
                  message.channel.send(embed);
                });
              });
            });
          });
        }
        if(args[0] == `${PREFIX}invite`){
          var embed = new Discord.MessageEmbed();
          embed.setColor('RANDOM');
          embed.setTitle("Bot Invite:");
          embed.setDescription("Press [here](https://discord.com/oauth2/authorize?client_id=836932069350440981&scope=bot&permissions=8) to invite me in your server");
          message.channel.send(embed);
        }
        /*if(args[0] == `${PREFIX}prefix`) {
          if(args.slice(1).join(" ")) {
            GuildInfo.prefix[`${message.guild.id}`] = args.slice(1).join(" ");
            con.query("UPDATE guilds_settings SET prefix = ? WHERE guild_id = ?", [args.slice(1).join(" "), message.guild.id]);
            message.channel.send("Prefix successfully updated!");
          }
          else message.channel.send("Syntax: mm!prefix [Prefix]");
        }*/
        if(args[0] == `${PREFIX}restart`) {
          if(IsOwner(message.author.id)) {
              var embed = new Discord.MessageEmbed();
              embed.setColor('RANDOM');
              embed.setTitle('Bot Restart:')
              embed.setDescription('Please wait!')
              message.channel.send(embed).then(msg => {
                  ssh.execCommand("service mighty restart");
                  var embed = new Discord.MessageEmbed();
                  embed.setColor('RANDOM');
                  embed.setTitle('Bot Restart:')
                  embed.setDescription('The bot has been succesfully restarted! Have fun :)');
                  msg.edit(embed)
              });
          }
          else {var embed = new Discord.MessageEmbed();
          embed.setColor('RANDOM');
          embed.setTitle('Bot Restart:')
          embed.setDescription('ERROR: You don`t have permission to execute this command.');
          message.channel.send(embed); }
      }
        if(args[0] == `${PREFIX}ping`)
        {
            message.channel.send("Please wait...").then (m => {
                var ping = m.createdTimestamp - message.createdTimestamp;
                var botPing = Math.round(bot.pi)
                let embed = new Discord.MessageEmbed;
                embed.setTitle(":ping_pong: Pong !")
                embed.setColor('RANDOM')
                embed.addField("Server latency:", ping+"ms", true)
                embed.addField("Discord API Latency:", bot.ws.ping+"ms", true)
                m.edit('', embed)
            })
        }
        if(args[0] == `${PREFIX}purge`)
        {
          const amount = args[1];
          if(!amount) return message.channel.send("```Syntax: " + PREFIX + "purge [Messages to delete]```")
          if(amount > 100) return message.channel.send("You cannot clear more than 100 messages !")
          if(amount < 1) return message.channel.send("You cannot clear less than 1 message !")
          if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("Insufficient permissions !")
          if(!isNaN(amount))
          {
      
            await message.channel.messages.fetch({limit: amount}).then(messages => {
              message.channel.bulkDelete(messages )});
              message.channel.send(":white_check_mark:")
              LogChannelSend("```PURGE LOG: "+message.author.tag+" has purged "+amount+" messages in channel "+message.channel.name+". (Guild: "+message.guild.name+")```")
          }
          else return message.channel.send("This argument can only handle numbers !")
        }  
        if(args[0] == `${PREFIX}voicemute`)
        {
          if(!message.member.hasPermission("MANAGE_MEMBERS")) return message.channel.send("Insufficient permissions !")
          if(!args[1]) return message.channel.send("```Syntax: " + PREFIX + "voicemute [Tagged User/UserID] [Duration (in minutes)] [Reason]```")
          if(!args[2]) return message.channel.send("```Syntax: " + PREFIX + "voicemute [Tagged User/UserID] [Duration (in minutes)] [Reason]```")
          var user = message.mentions.users.first() || bot.users.cache.get(args[1]);
          var member = await message.guild.member(user);
          let reason = 'No reason specified';
          if (args[3]) reason = args.splice(3).join(" ");
          if(!message.guild.member(user)) return message.channel.send("The specified user or ID does not exist or is not in the server.")    
          con.query(`SELECT * FROM voice_mute WHERE user_id = '${user.id}' AND guild_id = '${message.guild.id}'`, function(err, rows) {
            if(!rows[0])
            {
              let modHighestRole = -1;
              let memberHighestRole = -1;
              message.member.roles.cache.forEach((r) => {
                if (r.position > modHighestRole) modHighestRole = r.position;
              });
              member.roles.cache.forEach((r) => {
                if (r.position > memberHighestRole) memberHighestRole = r.position;
              });
              //if (member.id === message.author.id) return message.channel.send('You cannot voice mute yourself.');
              //if (modHighestRole <= memberHighestRole) return message.channel.send('Your role must be higher than the role of the person you want to mute.');
              if (!isNaN(args[1])) return message.channel.send(`**Duration** argument needs to be entered as a number`);
              var secunde = args[2] * 60
              var dailyget = Math.round(new Date() / 1000);
              if(member.voice.channel) {
                switch(member.voice.serverMute) {
                    case false: {
                        member.voice.setMute(true).then(() => {
                            let embed = new Discord.MessageEmbed;
                            var user_name = bot.users.cache.get(member.id).tag;
                            embed.setAuthor("✅ "+user_name+" has been voice muted by "+message.author.tag+" for "+args[2]+" minutes. Reason: "+reason+"")
                            embed.setColor('00FF00')
                            message.channel.send(embed)
                            con.query(`INSERT INTO voice_mute(user_id, guild_id, mute_time, mute_reason, mute_date) VALUES ('${member.id}', '${message.guild.id}', '${dailyget + secunde}', '${reason}', '${GenerateDate()}')`)
                            LogChannelSend("```Voicemute LOG: "+user_name+" has been voice muted by "+message.author.username+" for "+args[2]+" minutes. Reason "+reason+" | at "+GenerateDate()+" (Guild: "+message.guild.name+")```")
                        })
                        break;
                    }
                }
            }            
            }
            else
            {
              message.channel.send("This user is already voice muted !")
            }
          })
        }
        if(args[0] == `${PREFIX}voiceunmute`)
        {
          if(!message.member.hasPermission("MANAGE_MEMBERS")) return message.channel.send("Insufficient permissions !")
          if(!args[1]) return message.channel.send("```Syntax: " + PREFIX + "voiceunmute [Tagged User/UserID]```")
          var user = message.mentions.users.first() || bot.users.cache.get(args[1]);
          var member = await message.guild.member(user);    
          if(!message.guild.member(user)) return message.channel.send("The specified user or ID does not exist or is not in the server.")  
          con.query(`SELECT * FROM voice_mute WHERE user_id = '${user.id}' AND guild_id = '${message.guild.id}'`, function(err, rows) {
            if(rows[0])
            { 
              member.voice.setMute(false)
              var embed = new Discord.MessageEmbed;
              var user_name = bot.users.cache.get(member.id).tag;
              embed.setAuthor("✅ "+user_name+" has been voice unmuted !")
              embed.setColor('00FF00')
              message.channel.send(embed)
              LogChannelSend("```VOICE UNMUTE LOG: "+user_name+" has been voice unmuted by "+message.author.username+" | at "+GenerateDate()+" (Guild: "+message.guild.name+")```")
              con.query(`DELETE FROM voice_mute WHERE id = '${rows[0].id}'`)
            }
            else
            {
              message.channel.send("This user is not voice muted !")
            }
          })
        }
        if(args[0] == `${PREFIX}deafen`)
        {
          if(!message.member.hasPermission("MANAGE_MEMBERS")) return message.channel.send("Insufficient permissions !")
          if(!args[1]) return message.channel.send("```Syntax: " + PREFIX + "deafen [Tagged User/UserID] [Duration (in minutes)] [Reason]```")
          if(!args[2]) return message.channel.send("```Syntax: " + PREFIX + "deafen [Tagged User/UserID] [Duration (in minutes)] [Reason]```")
          var user = message.mentions.users.first() || bot.users.cache.get(args[1]);
          var member = await message.guild.member(user);
          let reason = 'No reason specified';
          if (args[3]) reason = args.splice(3).join(" ");
          if(!message.guild.member(user)) return message.channel.send("The specified user or ID does not exist or is not in the server.")    
          con.query(`SELECT * FROM defeans WHERE user_id = '${user.id}' AND guild_id = '${message.guild.id}'`, function(err, rows) {
            if(!rows[0])
            {
              var secunde = args[2] * 60
              var dailyget = Math.round(new Date() / 1000);
              let embed = new Discord.MessageEmbed;
              var user_name = bot.users.cache.get(member.id).tag;
              embed.setAuthor("✅ "+user_name+" has been voice defeaned by "+message.author.tag+" for "+args[2]+" minutes. Reason: "+reason+"")
              embed.setColor('00FF00')
              message.channel.send(embed)
              member.voice.setDeaf(true)
              LogChannelSend("```VOICE deafen LOG: "+user_name+" has been voice deafened by "+message.author.username+" for "+args[2]+" minutes. Reason "+reason+" | at "+GenerateDate()+" (Guild: "+message.guild.name+")```")
              con.query(`INSERT INTO defeans(user_id, defean_time, defean_reason, defean_date, guild_id) VALUES ('${member.id}', '${dailyget + secunde}', '${reason}', '${GenerateDate()}', '${message.guild.id}')`)
            }
            else return message.channel.send("This user is already defeaned.")
          })
        }
        if(args[0] == `${PREFIX}undeafen`)
        {
          if(!message.member.hasPermission("MANAGE_MEMBERS")) return message.channel.send("Insufficient permissions !")
          if(!args[1]) return message.channel.send("```Syntax: " + PREFIX + "undeafen [Tagged User/UserID]```")
          var user = message.mentions.users.first() || bot.users.cache.get(args[1]);
          var member = await message.guild.member(user);
          let reason = 'No reason specified';
          if (args[3]) reason = args.splice(3).join(" ");
          if(!message.guild.member(user)) return message.channel.send("The specified user or ID does not exist or is not in the server.")    
          con.query(`SELECT * FROM defeans WHERE user_id = '${user.id}' AND guild_id = '${message.guild.id}'`, function(err, rows) {
            if(rows[0])
            {
              let embed = new Discord.MessageEmbed;
              var user_name = bot.users.cache.get(member.id).tag;
              embed.setAuthor("✅ "+user_name+" has been undeafened !")
              embed.setColor('00FF00')
              message.channel.send(embed)
              member.voice.setDeaf(false)
              con.query(`DELETE FROM defeans WHERE id = '${rows[0].id}'`)
              LogChannelSend("```VOICE undeafen LOG: "+user_name+" has been undefeaned by "+message.author.username+" | at "+GenerateDate()+" (Guild: "+message.guild.name+")```")
            }
            else
            {
              message.channel.send("This user is not defeaned.")
            }
          })
        }
        if(args[0] == `${PREFIX}mute`)
        {
          if(!message.member.hasPermission("MANAGE_MEMBERS")) return message.channel.send("Insufficient permissions !")
          if(!args[1]) return message.channel.send("```Syntax: " + PREFIX + "mute [Tagged User/UserID] [Duration (in minutes)] [Reason]```")
          if(isNaN(args[2])) return message.channel.send("```Syntax: " + PREFIX + "mute [Tagged User/UserID] [Duration (in minutes)] [Reason]```")
          var user = message.mentions.users.first() || bot.users.cache.get(args[1]);
          var member = await message.guild.member(user);
          let reason = 'No reason specified';
          if (args[3]) reason = args.splice(3).join(" ");
          if(!message.guild.member(user)) return message.channel.send("The specified user or ID does not exist or is not in the server.")
          con.query(`SELECT * FROM mutes WHERE user_id = '${user.id}' AND mute_guild = '${message.guild.id}'`, function(err, rows) {
            if(!rows[0])
            { 
              let modHighestRole = -1;
              let memberHighestRole = -1;
              message.member.roles.cache.forEach((r) => {
                if (r.position > modHighestRole) modHighestRole = r.position;
              });
              member.roles.cache.forEach((r) => {
                if (r.position > memberHighestRole) memberHighestRole = r.position;
              });
              if (member.id === message.author.id) return message.channel.send('You cannot mute yourself.');
              if (modHighestRole <= memberHighestRole) return message.channel.send('Your role must be higher than the role of the person you want to mute.');
              if (!isNaN(args[1])) return message.channel.send(`**Duration** argument needs to be entered as a number`);
              var secunde = args[2] * 60
              var dailyget = Math.round(new Date() / 1000);
              var role = member.guild.roles.cache.find(role => role.name === "Muted");
              message.guild.channels.cache.forEach(async(c) => {
                await c.updateOverwrite(role, {
                  SEND_MESSAGES: false,
                  ADD_REACTIONS: false,
                  SEND_TTS_MESSAGES: false,
                  ATTACH_FILES: false,
                  SPEAK: false
                });
              });
              member.roles.cache.forEach((role_) => {
                member.roles.remove(role_).catch(() => { return; });
              });
              member.roles.add(role);

              var roles_array = [];
              member.roles.cache.forEach((role) => {
                roles_array.push(role.id);
              });


              let embedmute = new Discord.MessageEmbed;
              embedmute.setAuthor(`${user.username} has been muted by ${message.author.username}`, message.author.displayAvatarURL({dynamic : true}))
              embedmute.setTitle(`Reason: ${reason}\nDuration: ${args[2]} minutes`)
              embedmute.setColor('00FF00'); 
              message.channel.send(embedmute)
              con.query(`INSERT INTO mutes(user_id, mute_time, mute_date, mute_reason, mute_guild, roles_array) VALUES ('${user.id}','${dailyget + secunde}', '${GenerateDate()}', '${reason}', '${message.guild.id}', '${JSON.stringify(roles_array)}')`)
              LogChannelSend("```MUTE LOG: "+user.username+" has been muted by "+message.author.username+" | Reason: "+reason+" for "+args[2]+" minutes at "+GenerateDate()+" (Guild: "+message.guild.name+")```")
            }
            else
            {
              return message.channel.send("This user is already muted !")
            }
          })
        }
        if(args[0] == `${PREFIX}unmute`)
        {
          if(!message.member.hasPermission("MANAGE_MEMBERS")) return message.channel.send("Insufficient permissions !")
          if(!args[1]) return message.channel.send("```Syntax: " + PREFIX + "unmute [Tagged User/UserID]```")
          var user = message.mentions.users.first() || bot.users.cache.get(args[1]);
          var member = await message.guild.member(user);    
          if(!message.guild.member(user)) return message.channel.send("The specified user or ID does not exist or is not in the server.")  
          con.query(`SELECT * FROM mutes WHERE user_id = '${user.id}' AND mute_guild = '${message.guild.id}'`, function(err, rows) {
            if(rows[0])
            { 
              var roles_array = JSON.parse(rows[0].roles_array);

              var role = member.guild.roles.cache.find(role => role.name === "Muted");
              if(role) {
                member.roles.remove(role);
              }

              roles_array.forEach((id) => {
                var role = message.guild.roles.cache.get(id);
                if(role) {
                  member.roles.add(role).catch(() => {});
                }
              });

              var embed = new Discord.MessageEmbed;
              var user_name = bot.users.cache.get(member.id).tag;
              embed.setAuthor("✅ "+user_name+" has been unmuted !")
              embed.setColor('00FF00')
              message.channel.send(embed)
              con.query(`DELETE FROM mutes WHERE id = '${rows[0].id}'`)
              LogChannelSend("```Unmute LOG: "+user_name+" has been unmuted by "+message.author.username+" | at "+GenerateDate()+" (Guild: "+message.guild.name+")```")
            }
            else
            {
              message.channel.send("This user is not muted.")
            }
          })
        }
        if(args[0] == `${PREFIX}ban`)
        {
          if(!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("Insufficient permissions !")
          if(!args[1]) return message.channel.send("```Syntax: " + PREFIX + "ban [Tagged User/UserID] [Reason]```")
          var user = message.mentions.users.first() || bot.users.cache.get(args[1]);
          var member = await message.guild.member(user);
          let reason = 'No reason specified';
          if (args[2]) reason = args.splice(2).join(" ");
          if(!message.guild.member(user)) 
          {
            let embedban = new Discord.MessageEmbed;
            embedban.setAuthor(`${user.username} has been banned by ${message.author.username}`, message.author.displayAvatarURL({dynamic : true}))
            embedban.setTitle(`Reason: ${reason}`)
            embedban.setColor('00FF00'); 
            LogChannelSend("```BAN LOG: "+user.username+" has been banned by "+message.author.username+" | Reason: "+reason+" at "+GenerateDate()+" (Guild: "+message.guild.name+")```")
            message.channel.send(embedban)
            return message.guild.members.ban(user, {reason:reason})           
          }
          else
          {
            let modHighestRole = -1;
            let memberHighestRole = -1;
            message.member.roles.cache.forEach((r) => {
              if (r.position > modHighestRole) modHighestRole = r.position;
            });
            member.roles.cache.forEach((r) => {
              if (r.position > memberHighestRole) memberHighestRole = r.position;
            });
            if (member.id === message.author.id) return message.channel.send('You cannot ban yourself.');
            if (modHighestRole <= memberHighestRole) return message.channel.send('Your role must be higher than the role of the person you want to ban.');
            let embedban = new Discord.MessageEmbed;
            embedban.setAuthor(`${member.displayName} has been banned by ${message.author.username}`, message.author.displayAvatarURL({dynamic : true}))
            embedban.setTitle(`Reason: ${reason}`)
            embedban.setColor('00FF00'); 
            LogChannelSend("BAN LOG: "+member.displayName+" has been banned by "+message.author.username+" | Reason: "+reason+" at "+GenerateDate()+" (Guild: "+message.guild.name+")")
            message.channel.send(embedban)
            return member.ban({reason:reason})
          }
        }
        if(args[0] == `${PREFIX}kick`)
        {
          if(!message.member.hasPermission("KICK_MEMBERS")) return message.channel.send("Insufficient permissions !")
          if(!args[1]) return message.channel.send("```Syntax: " + PREFIX + "kick [Tagged User/UserID] [Reason]```")
          var user = message.mentions.users.first() || bot.users.cache.get(args[1]);
          var member = await message.guild.member(user);
          let reason = 'No reason specified';
          if (args[2]) reason = args.splice(2).join(" ");
          if(!message.guild.member(user)) return message.channel.send("The specified user or ID does not exist or is not in the server.")
          let modHighestRole = -1;
          let memberHighestRole = -1;
          message.member.roles.cache.forEach((r) => {
            if (r.position > modHighestRole) modHighestRole = r.position;
          });
          member.roles.cache.forEach((r) => {
            if (r.position > memberHighestRole) memberHighestRole = r.position;
          });
          if (modHighestRole <= memberHighestRole) return message.channel.send('Your role must be higher than the role of the person you want to kick.');
          if (member.id === message.author.id) return message.channel.send('You cannot kick yourself.');
          let embedkick = new Discord.MessageEmbed;
          embedkick.setAuthor(`${member.displayName} has been kicked by ${message.author.username}`, message.author.displayAvatarURL({dynamic : true}))
          embedkick.setTitle(`Reason: ${reason}`)
          embedkick.setColor('00FF00'); 
          message.channel.send(embedkick)
          LogChannelSend("```Kick LOG: "+member.displayName+" has been kicked by "+message.author.username+" | Reason: "+reason+" at "+GenerateDate()+"```")
          member.kick({reason: reason}); 
        }
        if(args[0] == `${PREFIX}unban`)
        {
          if(!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("Insufficient permissions !")
          if(!args[1]) return message.channel.send("```Syntax: " + PREFIX + "unban [UserID]```")
          let userID = args[1]
          message.guild.fetchBans().then(bans=> {
            if(bans.size == 0) return 
            let bUser = bans.find(b => b.user.id == userID)
            if(!bUser) return
            message.guild.members.unban(bUser.user)
            let embed = new Discord.MessageEmbed;
            var user_name = bot.users.cache.get(userID).tag;
            embed.setAuthor("✅ "+user_name+" has been unbanned !")
            embed.setColor('00FF00')
            message.channel.send(embed)
            LogChannelSend("```Unban LOG: "+user_name+" has been unbanned by "+message.author.username+" | at "+GenerateDate()+" (Guild: "+message.guild.name+")```")
          })
        }
        if(args[0] == `${PREFIX}anti`){
          if(args[1]){
            con.query("SELECT * FROM guilds_settings WHERE guild_id = ?", [message.guild.id], function(err, result){
              if(args[1] == "ban"){
                UpdateGuildSettings(message.guild.id, 'anti_ban', !result[0].anti_ban);
                var embed = new Discord.MessageEmbed(); 
                embed.setAuthor(`Anti-Ban: ${result[0].anti_ban ? '❌ Disabled' : '✅ Enabled'}`);
                embed.setColor(result[0].anti_ban ? 'FF0000' : '00FF00')
                message.channel.send(embed);
              }
              else if(args[1] == "kick"){
                UpdateGuildSettings(message.guild.id, 'anti_kick', !result[0].anti_kick);
                var embed = new Discord.MessageEmbed(); 
                embed.setAuthor(`Anti-Kick: ${result[0].anti_kick ? '❌ Disabled' : '✅ Enabled'}`);
                embed.setColor(result[0].anti_kick ? 'FF0000' : '00FF00')
                message.channel.send(embed);
              }
              else if(args[1] == "roledelete"){
                UpdateGuildSettings(message.guild.id, 'anti_roledelete', !result[0].anti_roledelete);
                var embed = new Discord.MessageEmbed(); 
                embed.setAuthor(`Anti-RoleDelete: ${result[0].anti_roledelete ? '❌ Disabled' : '✅ Enabled'}`);
                embed.setColor(result[0].anti_roledelete ? 'FF0000' : '00FF00')
                message.channel.send(embed);
              }
              else if(args[1] == "mention"){
                UpdateGuildSettings(message.guild.id, 'anti_mention', !result[0].anti_mention);
                var embed = new Discord.MessageEmbed(); 
                embed.setAuthor(`Anti-Mention: ${result[0].anti_mention ? '❌ Disabled' : '✅ Enabled'}`);
                embed.setColor(result[0].anti_mention ? 'FF0000' : '00FF00')
                message.channel.send(embed);
              }
              else if(args[1] == "channelcreate"){
                UpdateGuildSettings(message.guild.id, 'anti_channelcreate', !result[0].anti_channelcreate);
                var embed = new Discord.MessageEmbed(); 
                embed.setAuthor(`Anti-ChannelCreate: ${result[0].anti_channelcreate ? '❌ Disabled' : '✅ Enabled'}`);
                embed.setColor(result[0].anti_channelcreate ? 'FF0000' : '00FF00')
                message.channel.send(embed);
              }
              else if(args[1] == "channeldelete"){
                UpdateGuildSettings(message.guild.id, 'anti_channeldelete', !result[0].anti_channeldelete);
                var embed = new Discord.MessageEmbed(); 
                embed.setAuthor(`Anti-ChannelDelete: ${result[0].anti_channeldelete ? '❌ Disabled' : '✅ Enabled'}`);
                embed.setColor(result[0].anti_channeldelete ? 'FF0000' : '00FF00')
                message.channel.send(embed);
              }
              else if(args[1] == "roleupdate"){
                UpdateGuildSettings(message.guild.id, 'anti_roleupdate', !result[0].anti_roleupdate);
                var embed = new Discord.MessageEmbed(); 
                embed.setAuthor(`Anti-RoleUpdate: ${result[0].anti_roleupdate ? '❌ Disabled' : '✅ Enabled'}`);
                embed.setColor(result[0].anti_roleupdate ? 'FF0000' : '00FF00')
                message.channel.send(embed);
              }
              else if(args[1] == "spam"){
                UpdateGuildSettings(message.guild.id, 'anti_spam', !result[0].anti_spam)
                var embed = new Discord.MessageEmbed(); 
                embed.setAuthor(`Anti-Spam: ${result[0].anti_spam ? '❌ Disabled' : '✅ Enabled'}`);
                embed.setColor(result[0].anti_spam ? 'FF0000' : '00FF00')
                message.channel.send(embed);
              }
              else if(args[1] == "invite-link"){
                UpdateGuildSettings(message.guild.id, 'anti_invitelink', !result[0].anti_invitelink)
                var embed = new Discord.MessageEmbed(); 
                embed.setAuthor(`Anti-InviteLink: ${result[0].anti_invitelink ? '❌ Disabled' : '✅ Enabled'}`);
                embed.setColor(result[0].anti_invitelink ? 'FF0000' : '00FF00')
                message.channel.send(embed);
              }
              else if(args[1] == "roleadd"){
                UpdateGuildSettings(message.guild.id, 'anti_roleadd', !result[0].anti_roleadd)
                var embed = new Discord.MessageEmbed(); 
                embed.setAuthor(`Anti-RoleAdd: ${result[0].anti_roleadd ? '❌ Disabled' : '✅ Enabled'}`);
                embed.setColor(result[0].anti_roleadd ? 'FF0000' : '00FF00')
                message.channel.send(embed);
              }
              else {
                var embed=new Discord.MessageEmbed();
                embed.setTitle("Anti Help:");
                embed.setColor('RANDOM');
                embed.setDescription(`Available Modules:\n**ban (${!result[0].anti_ban ? '❌ Disabled' : '✅ Enabled'})\nkick (${!result[0].anti_kick ? '❌ Disabled' : '✅ Enabled'})\nroledelete (${!result[0].anti_roledelete ? '❌ Disabled' : '✅ Enabled'})\nmention (${!result[0].anti_mention ? '❌ Disabled' : '✅ Enabled'})\nchannelcreate (${!result[0].anti_channelcreate ? '❌ Disabled' : '✅ Enabled'})\nchanneldelete (${!result[0].anti_channeldelete ? '❌ Disabled' : '✅ Enabled'})\nroleupdate (${!result[0].anti_roleupdate ? '❌ Disabled' : '✅ Enabled'})\nspam (${!result[0].anti_spam ? '❌ Disabled' : '✅ Enabled'})\ninvite-link (${!result[0].anti_invitelink ? '❌ Disabled' : '✅ Enabled'})\nroleadd (${!result[0].anti_roleadd ? '❌ Disabled' : '✅ Enabled'})**`);
                message.channel.send(embed);
              }
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "anti [Module]```");
        }
        if(args[0] == `${PREFIX}settings`) {
          if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("Insufficient permissions !")
          con.query("SELECT * FROM guilds_settings WHERE guild_id = ?", [message.guild.id], function(err, result) {
            if(result != 0) {
              var embed = new Discord.MessageEmbed();
              embed.setTitle("Guild: Settings");
              embed.setColor('RANDOM');
              embed.addField("#", ":one:\n:two:\n:three:\n:four:\n:five:\n:six:", true);
              embed.addField("Name:", "Spam Mute Time\nServer Stats\nWelcome channel\nYouTube announce Channel\nBirthday announce Channel\nAuto role", true);
              embed.addField("Current Value:", `${result[0].spam_default_mute_minutes}\n${result[0].server_stats != "0" ? 'enabled' : 'disabled'}\n${result[0].welcome_channel != "0" ? 'enabled' : 'disabled'}\n${result[0].ytb_announce_channel != "0" ? 'enabled' : 'disabled'}\n${result[0].birthday_announce_channel != "0" ? 'enabled' : 'disabled'}\n${result[0].auto_role != "0" ? 'enabled' : 'disabled'}`, true);
              message.channel.send(embed).then(msg => {
                for(var i = 1; i <= 6; i++) {
                  msg.react(reaction_numbers[i]);
                }
                const filter = (reaction, user) => {
                  var string = '';
                  for(var i = 1; i <= 6; i++) {
                    if(i == 1) string = `'${reaction_numbers[i]}'`;
                    else if(i >= 2) string += `, '${reaction_numbers[i]}'`;
                  }
                  return eval(`[${string}].includes(reaction.emoji.name) && user.id === message.author.id`);
                };
                msg.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] }).then(collected => {
                  const reaction = collected.first();
                  msg.reactions.removeAll().catch(() => {})

                  if(settings_manage[`${message.author.id}`+`${message.guild.id}`]) {
                    clearInterval(settings_manage[`${message.author.id}`+`${message.guild.id}`].interval);
                    delete settings_manage[`${message.author.id}`+`${message.guild.id}`];
                  }

                  if(reaction.emoji.name == reaction_numbers[1]) {
                    msg.delete();
                    msg.channel.send("Now type in the chat the default value for **Spam Mute Time**").then(msg => {
                      EnableSettingsManageForSpecificSettings(msg, 1);
                    });
                  }
                  if(reaction.emoji.name == reaction_numbers[2]) {
                    if(message.member.guild.me.hasPermission("MANAGE_CHANNELS")) {
                      msg.delete();
                      var embed = new Discord.MessageEmbed();
                      embed.setAuthor(`Server-Stats: ${result[0].server_stats != "0" ? '❌ Disabled' : '✅ Enabled'}`);
                      embed.setColor(result[0].server_stats != "0" ? 'FF0000' : '00FF00');
                      message.channel.send(embed)

                      if(result[0].server_stats == "0") {
                        message.guild.channels.create("SERVER STATS", {
                          type: "category",
                          position: 0
                        }).then((c) => {
                          UpdateGuildSettings(message.guild.id, "server_stats", `${c.id}`);
                          CheckingGuildCounter(message.guild.id);
                        });
                      }
                      else {
                        UpdateGuildSettings(message.guild.id, "server_stats", "0");
                        DeleteChannelsFromCounterCategory(message.guild.id, result[0].server_stats);
                      }
                    }
                    else {
                      msg.delete();
                      var embed = new Discord.MessageEmbed();
                      embed.setAuthor("Error: Please verify if I have 'MANAGE_CHANNELS' permission!");
                      embed.setColor("FF0000");
                      message.channel.send(embed);
                    }
                  }
                  if(reaction.emoji.name == reaction_numbers[3]) {
                    msg.delete();
                    msg.channel.send("Now mention in the chat the **Welcome Channel**").then(msg => {
                      EnableSettingsManageForSpecificSettings(msg, 2);
                    });
                  }
                  if(reaction.emoji.name == reaction_numbers[4]) {
                    msg.delete();
                    msg.channel.send("Now mention in the chat the **Youtube announce Channel**").then(msg => {
                      EnableSettingsManageForSpecificSettings(msg, 3);
                    });
                  }
                  if(reaction.emoji.name == reaction_numbers[5]) {
                    msg.delete();
                    msg.channel.send("Now mention in the chat the **Birthday announce Channel**").then(msg => {
                      EnableSettingsManageForSpecificSettings(msg, 4);
                    });
                  }
                  if(reaction.emoji.name == reaction_numbers[6]) {
                    msg.delete();
                    msg.channel.send("Now mention in the chat the **Autorole role**").then(msg => {
                      EnableSettingsManageForSpecificSettings(msg, 5);
                    });
                  }

                  function EnableSettingsManageForSpecificSettings(msg, settings_type) {
                    settings_manage[`${message.author.id}`+`${message.guild.id}`] = {
                      channel_id: msg.channel.id,
                      timeout: setTimeout(() => {
                        if(settings_manage[`${message.author.id}`+`${message.guild.id}`]) {
                          delete settings_manage[`${message.author.id}`+`${message.guild.id}`];
                        }
                      }, 10000),
                      settings: settings_type,
                      msg: msg
                    }
                  }
                })
                .catch(console.log);
              });
            }
          });
        }
        //=======================================================================================================
        //                                      Music System
        //=======================================================================================================
        
      /*if(args[0] == `${PREFIX}porn`) {
        if(message.channel.nsfw) {
          if(args[1]) {
              var content;
              if(args[1] == "ass") {
                  content = hentapi.nsfw.ass();
              }
              else if(args[1] == "bdsm") {
                  content = hentapi.nsfw.bdsm();
              }
              else if(args[1] == "cum") {
                  content = hentapi.nsfw.cum();
              }
              else if(args[1] == "hentai") {
                  content = hentapi.nsfw.hentai();
              }
              else if(args[1] == "orgy") {
                  content = hentapi.nsfw.orgy();
              }
              else if(args[1] == "blowjob") {
                  content = hentapi.nsfw.blowjob();
              }
              else if(args[1] == "foot") {
                  content = hentapi.nsfw.foot();
              }
              else if(args[1] == "vagina") {
                  content = hentapi.nsfw.vagina();
              }
              else if(args[1] == "gangbang") {
                  content = hentapi.nsfw.gangbang();
              }
              else if(args[1] == "gif") {
                  content = hentapi.nsfw.gif();
              }
              setTimeout(() => {
                  if(content != undefined) {
                      var embed = new Discord.MessageEmbed();
                      embed.setColor('RANDOM');
                      embed.setImage(content);
                      message.channel.send(embed);
                  }
                  else {
                      message.channel.send(`Invalid porn category! Ex ${PREFIX}porn gangbang !`);
                  }
              }, 1000);
          }
          else message.channel.send("```Syntax: " + PREFIX + "porn [Category] ex: gangbang, gif, vagina, foot, etc...```");
        }
        else message.channel.send("❌ | This command is avaliable only in NSFW channels.");
      }*/
      if(args[0] == `${PREFIX}creategiveaway`)
      {
        if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("Insufficient permissions !")
        con.query("SELECT * FROM giveaways WHERE guild_id = ? AND creator = ?", [message.guild.id, message.author.id], function(err, result) {
          if(result == 0) {
            if(!args[1]) return message.channel.send("```Syntax: " + PREFIX + "creategiveaway [Expiration ex ( mm!creategiveaway minute 5 Minecraft Account )] [day/hour/minute/second] [Expiration Value] [Prize]```")
            let prize = 'No prize specified';
            if (args[3]) prize = args.splice(3).join(" ");
            if(prize.size < 1 || prize.size > 100) return message.channel.send("The prize name can't be lower than one charachter or bigger than 100 characters.")
            var success=false, string_time;
            if(args[1]=="second"){
              if(args[2] < 10 || args[2] > 60) return message.channel.send("The giveaway can't be less than 10 seconds long or more than 60 seconds long.")
              string_time=parseInt(args[2]);
              success=true;
            }
            if(args[1]=="minute"){
              if(args[2] < 1 || args[2] > 60) return message.channel.send("The giveaway can't be less than 1 minute long or more than 60 minutes long.")
              string_time=parseInt(args[2])*60;
              success=true;
            }
            if(args[1]=="hour"){
              if(args[2] < 1 || args[2] > 24) return message.channel.send("The giveaway can't be less than 1 hour long or more than 24 hour long.")
              string_time=parseInt(args[2])*3600;
              success=true;
            }
            if(args[1]=="day"){
              if(args[2] < 1 || args[2] > 10) return message.channel.send("The giveaway can't be less than 1 day long or more than 10 days long.")
              string_time=parseInt(args[2])*86400;
              success=true;
            }
            if(success==true){
              var dailyget = Math.round(new Date() / 1000); 
              var embed = new Discord.MessageEmbed;
              embed.setDescription(`${message.author.tag}'s giveaway.\n@here`)
              embed.addField(`Prize: `, prize, true)
              embed.addField(`Expiration: `, secondsToHms(string_time), true)
              message.channel.send(embed).then((msg) => { 
                LogChannelSend(`${message.author.tag} created a giveaway in guild ${message.guild.name} with prize: ${prize}. What will expire in: ${secondsToHms(string_time)}`)
                msg.react("🎁");
                con.query(`INSERT INTO giveaways(guild_id, creator, channel_id, message_id, prize, expiration) VALUES ('${message.guild.id}', '${message.author.id}', '${msg.channel.id}', '${msg.id}', '${prize}', '${dailyget + string_time}')`)
              });
            }
            else message.channel.send("Invalid argument.");
          }
          else message.channel.send("You already started a giveaway. Please use command mm!stopgiveaway to stop it.");
        });
      }
        if(args[0] == `${PREFIX}stopgiveaway`){
          if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("Insufficient permissions !")
          con.query("SELECT * FROM giveaways WHERE guild_id = ? AND creator = ?", [message.guild.id, message.author.id], function(err, result) {
            if(result != 0){
              var cacheChannel = bot.guilds.cache.get(result[0].guild_id).channels.cache.get(result[0].channel_id);
              if(cacheChannel){
                cacheChannel.messages.fetch(result[0].message_id).then(message => {
                  message.channel.send("Giveaway successfully stopped");
                  message.delete();
                  con.query("DELETE FROM giveaways WHERE id = ?", [result[0].id]);
                  LogChannelSend(`${message.author.tag} has stopped his giveaway`);
                }).catch(() => {
                  message.channel.send("Message not found, possible deleted...");
                  con.query("DELETE FROM giveaways WHERE id = ?", [result[0].id]);
                });
              }
              else{
                message.channel.send("Channel not found, possible deleted...");
                con.query("DELETE FROM giveaways WHERE id = ?", [result[0].id]);
              }
            }
            else message.channel.send("You don't started a giveaway.");
          });
        }
        if(args[0] == `${PREFIX}deleterole`) {
          if(!message.member.hasPermission("ADMINISTRATOR") || !message.member.guild.me.hasPermission("ADMINISTRATOR")) return message.channel.send("Insufficient permissions !")
          if(args[1]){
            var role = message.guild.roles.cache.find(role => role.name == args.slice(1).join(" "));
            if(role){
              role.delete().then((r) => {
                message.channel.send(`Role: ${r.name} deleted!`);
              });
            }
            else message.channel.send("Role not found with this name!");
          }
          else message.channel.send("```Syntax: " + PREFIX + "deleterole [Name]```");
        }
        if(args[0] == `${PREFIX}createrole`) {
          if(!message.member.hasPermission("ADMINISTRATOR") || !message.member.guild.me.hasPermission("ADMINISTRATOR")) return message.channel.send("Insufficient permissions !")
          if(args[1] && args[2]){
            if(/^#[0-9A-F]{6}$/i.test('#'+args[1])){ 
              var role = message.guild.roles.cache.find(role => role.name == args.slice(2).join(" "));
              if(!role){
                message.guild.roles.create({
                  data: {
                    name: args.slice(2).join(" "),
                    color: '#'+args[1]
                  }
                }).then((r) => {
                  var role_color_string = ntc.name('#'+args[1]);
                  var embed = new Discord.MessageEmbed();
                  embed.setDescription(`New role created: **${r.name}** with color: **${role_color_string[1]}**`);
                  embed.setColor('#'+args[1]);
                  embed.addField("#", ":one:\n:two:\n:three:\n:four:\n:five:\n:six:\n:seven:\n:eight:\n:nine:\n:keycap_ten:", true);
                  embed.addField("Permission", "ADMINISTRATOR\nADD_REACTIONS\nATTACH_FILES\nBAN_MEMBERS\nCHANGE_NICKNAME\nCONNECT\nCREATE_INSTANT_INVITE\nDEAFEN_MEMBERS\nEMBED_LINKS\nKICK_MEMBERS", true);
                  message.channel.send(embed).then(msg => {
                    EditRoleFunction(message, msg, args[1], r, role_color_string); 
                  });
                }).catch(() => { return; });
              }
              else message.channel.send("This role already exists!");
            }
            else message.channel.send("Invalid Hex Color!");
          }
          else message.channel.send("```Syntax: " + PREFIX + "createrole [Hex Color] [Name] (Ex: mm!createrole FF0000 A Red Role)```");
        }
        if(args[0] == `${PREFIX}editrole`){
          if(!message.member.hasPermission("ADMINISTRATOR") || !message.member.guild.me.hasPermission("ADMINISTRATOR")) return message.channel.send("Insufficient permissions !")
          if(args[1]){
            var role = message.guild.roles.cache.find(role => role.name == args.slice(1).join(" "));
            if(role){
              var role_color_string = ntc.name(role.hexColor);
              var embed = new Discord.MessageEmbed();
              embed.setDescription(`Now editing role: **${role.name}** with color: **${role_color_string[1]}**`);
              embed.setColor(role.hexColor);
              embed.addField("#", ":one:\n:two:\n:three:\n:four:\n:five:\n:six:\n:seven:\n:eight:\n:nine:\n:keycap_ten:", true);
              embed.addField("Permission", "ADMINISTRATOR\nADD_REACTIONS\nATTACH_FILES\nBAN_MEMBERS\nCHANGE_NICKNAME\nCONNECT\nCREATE_INSTANT_INVITE\nDEAFEN_MEMBERS\nEMBED_LINKS\nKICK_MEMBERS", true);
              message.channel.send(embed).then(msg => {
                EditRoleFunction(message, msg, `${role.hexColor[1]+role.hexColor[2]+role.hexColor[3]+role.hexColor[4]+role.hexColor[5]+role.hexColor[6]}`, role, role_color_string);
              });
            }
            else message.channel.send("Role not found with this name!");
          }
          else message.channel.send("```Syntax: " + PREFIX + "editrole [Name]```");
        }
        if(args[0] == `${PREFIX}gay`){
          var user = message.mentions.users.first();
          if(!user) user = message.author;
          var canvas = Canvas.createCanvas(487, 487);
          var ctx = canvas.getContext('2d');
          var background = await Canvas.loadImage('./images/gay.png');
          ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = 0.6;
          var avatar = await Canvas.loadImage(user.displayAvatarURL({ format: 'png' }));
          ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);
          var attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'gay.png');
          message.channel.send(attachment);
        }
        if(args[0] == `${PREFIX}diploma`){
          GetGuildSettings(message.guild.id, "blacklist_diploma", async (blacklist_diploma) => {
            if(blacklist_diploma == 1 && !IsOwner(message.author.id)) return message.channel.send("**BLACKLIST**: Enabled!");
            else {
              if(!Diploma_Cooldown[message.author.id]) Diploma_Cooldown[message.author.id] = 0;
              if(Diploma_Cooldown[message.author.id] < Math.floor(Date.now() / 1000)){
                var userx = message.mentions.users.first();
                if(!userx) userx = message.author;
                const canvas = Canvas.createCanvas(2200, 1700);
                const ctx = canvas.getContext('2d');
                const background = await Canvas.loadImage('./images/diploma-de-prost.png');
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#74037b';
                ctx.strokeRect(0, 0, canvas.width, canvas.height);
                ctx.font = '80px sans-serif';
                ctx.textAlign = "center";
                ctx.fillStyle = '#000000';
                ctx.fillText(userx.username, canvas.width / 2, canvas.height / 1.8); 
                ctx.fillText(GenerateDate(), canvas.width / 2, canvas.height / 1.3);
                const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'diploma-de-prost.png');
                message.channel.send(`<@${userx.id}> felicitari pentru diploma de prost !`, { files: [attachment] }).then(() => {
                  Diploma_Cooldown[message.author.id] = Math.floor(Date.now() / 1000) + 10;
                });
              }
              else {
                var difference = timeDiffCalc(new Date(Diploma_Cooldown[message.author.id] * 1000), new Date(Date.now()), true);
                message.channel.send(`**COOLDOWN:** Please wait ${difference.seconds} seconds to use this command again.`);
              }
            }
          });
        }
        if(args[0] == `${PREFIX}seconddiploma`){
          GetGuildSettings(message.guild.id, "blacklist_diploma", async (blacklist_diploma) => {
            if(blacklist_diploma == 1 && !IsOwner(message.author.id)) return message.channel.send("**BLACKLIST**: Enabled!");
            else {
              if(!Diploma_Cooldown[message.author.id]) Diploma_Cooldown[message.author.id] = 0;
              if(Diploma_Cooldown[message.author.id] < Math.floor(Date.now() / 1000)){
                var userx = message.mentions.users.first();
                if(!userx) userx = message.author;
                const canvas = Canvas.createCanvas(2200, 1700);
                const ctx = canvas.getContext('2d');
                const background = await Canvas.loadImage('./images/diploma-de-supt.png');
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#74037b';
                ctx.strokeRect(0, 0, canvas.width, canvas.height);
                ctx.font = '80px sans-serif';
                ctx.textAlign = "center";
                ctx.fillStyle = '#000000';
                ctx.fillText(userx.username, canvas.width / 2, canvas.height / 1.8); 
                ctx.fillText(GenerateDate(), canvas.width / 2, canvas.height / 1.3);
                const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'diploma-de-prost.png');
                message.channel.send(`Felicitari, <@${userx.id}> ! Ai primit diploma de supt! Sa o stapanesti sanatos!!!`, { files: [attachment] }).then(() => {
                  Diploma_Cooldown[message.author.id] = Math.floor(Date.now() / 1000) + 10;
                });
              }
              else {
                var difference = timeDiffCalc(new Date(Diploma_Cooldown[message.author.id] * 1000), new Date(Date.now()), true);
                message.channel.send(`**COOLDOWN:** Please wait ${difference.seconds} seconds to use this command again.`);
              }
            }
          });
        }
        if(args[0] == `${PREFIX}whitelist`) {
          if(IsOwner(message.author.id)) {
            var user = bot.users.cache.get(args[1]) ? bot.users.cache.get(args[1]) : message.mentions.users.first();
            if(user) {
              con.query("SELECT * FROM users_data WHERE user_id = ? AND guild_id = ?", [user.id, message.guild.id], function(err, result) {
                if(result != 0) {
                  var current_whitelist = result[0].whitelist;
                  var embed = new Discord.MessageEmbed();
                  embed.setColor("RANDOM");
                  embed.setDescription(`${current_whitelist ? 'disabling' : 'enabling'} whitelist for **${user.tag}**`);
                  message.channel.send(embed).then(msg => {
                    embed.setDescription(`Successfully ${current_whitelist ? 'disabled' : 'enabled'} whitelist for **${user.tag}**`);
                    current_whitelist =! current_whitelist;
                    con.query("UPDATE users_data SET whitelist = ? WHERE user_id = ? AND guild_id = ?", [current_whitelist, user.id, message.guild.id]);
                    msg.edit(embed);
                  });
                }
                else message.channel.send("sql error");
              }); 
            }
            else message.channel.send("```Syntax: " + PREFIX + "whitelist [User]```");
          }
          else message.channel.send("Missing permission");
        }
        if(args[0] == `${PREFIX}blacklistdiploma`){
          if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("Insufficient permissions !");
          con.query("SELECT * FROM guilds_settings WHERE guild_id = ?", [message.guild.id], function(err, result){
            if(result != 0){
              UpdateGuildSettings(message.guild.id, "blacklist_diploma", !result[0].blacklist_diploma);
              var embed = new Discord.MessageEmbed();
              embed.setAuthor(`Blacklist-Diploma: ${result[0].blacklist_diploma ? '❌ Disabled' : '✅ Enabled'}`);
              embed.setColor(result[0].blacklist_diploma ? 'FF0000' : '00FF00')
              message.channel.send(embed);
            }
          });
        }
        if(args[0] == `${PREFIX}tiktoklookup`){
          if(args.slice(1).join(" ")) {
            message.channel.send("Please wait...").then(async msg => {
                var sended = false;
                setTimeout(() => {
                    if(sended == false) {
                        msg.delete();
                        message.channel.send("User not found!");
                    }
                }, 2000);
                var result = await TikTokScraper.getUserProfileInfo(args.slice(1).join(" "));
                if(!result.user.nickname) nickname = "null";
                else nickname = result.user.nickname;
                if(!result.user.signature) signature = "null";
                else signature = result.user.signature;
                var embed = new Discord.MessageEmbed();
                embed.setColor('RANDOM');
                embed.setTitle(`${result.user.uniqueId} - INFO:`);
                embed.setThumbnail(result.user.avatarLarger);
                embed.addFields(
                  { name: "ID:", value: `${result.user.id}` },
                  { name: "Nickname:", value: `${nickname}` },
                  { name: "Followers:", value: `${result.stats.followerCount}` },
                  { name: "Following:", value: `${result.stats.followingCount}` },
                  { name: "Total videos:", value: `${result.stats.videoCount}` },
                  { name: "Private account:", value: `${result.user.privateAccount}` },
                  { name: "Verified account:", value: `${result.user.verified}` },
                  { name: "Member since:", value: `${TimestampConvert(result.user.createTime)}` },
                  { name: "Signature:", value: `${signature}` }
                );
                msg.delete();
                message.channel.send(embed).then(() => {
                    sended = true;
                });
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "tiktoklookup [User]```");
        }
        if(args[0] == `${PREFIX}instalookup`){
          if(args.slice(1).join(" ")) {
            message.channel.send("Please wait...").then(async msg => {
                await InstagramScrapper.scrapeUserPage(args[1]).then(result => {
                  var biography = result.user.biography;
                  if(biography == "") biography = "null";

                  var embed = new Discord.MessageEmbed();
                  embed.setColor('RANDOM');
                  embed.setTitle(`${result.user.username} - INFO`);
                  embed.setThumbnail(result.user.profile_pic_url_hd);
                  embed.addFields
                  (
                      { name: "ID:", value: `${result.user.id}` },
                      { name: "Full Name:", value: `${result.user.full_name}` },
                      { name: "Followers:", value: `${result.user.edge_followed_by.count}` },
                      { name: "Following:", value: `${result.user.edge_follow.count}` },
                      { name: "Business account:", value: `${result.user.is_business_account}` },
                      { name: "Private account:", value: `${result.user.is_private}` },
                      { name: "Verified account:", value: `${result.user.is_verified}` },
                      { name: "Biography:", value: `${biography}` }
                  );
                  msg.delete();
                  message.channel.send(embed);
                }).catch(() => {
                  msg.delete();
                  message.channel.send("User not found!");
                });
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "instalookup [Instagram ID]```");
        }
        if(args[0] == `${PREFIX}samplookup`){
          if(args[1] && args[2]) {
            var error_sended = false;
            samplookup({host: args[1], port: args[2]}, function (error, result) {
                if(error_sended == false) {
                    message.channel.send("Please wait...").then(msg => {
                        if(error) {
                            error_sended = true;
                            msg.delete();
                            message.channel.send("Unknown name or service.");
                        }
                        else {
                            var language;
                            if(result.mapname == "") language = "null";
                            else language = result.mapname;
                            var embed = new Discord.MessageEmbed();
                            embed.setColor('RANDOM');
                            embed.setTitle(`SA-MP Lookup: ${args[1]}:${args[2]}`);
                            embed.addFields
                            (
                                { name: "Hostname:", value: `${result.hostname}` },
                                { name: "Players:", value: `${result.online}/${result.maxplayers}` },
                                { name: "Gamemode:", value: `${result.gamemode}` },
                                { name: "Map:", value: `${result.rules.mapname}` },
                                { name: "Language:", value: `${language}` },
                                { name: "Weburl:", value: `${result.rules.weburl}` }
                            );
                            msg.delete();
                            message.channel.send(embed);
                        }
                    });
                }
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "samplookup [IP] [Port]```");
        }
        if(args[0] == `${PREFIX}steamlookup`){
          if(args[1]) {
            message.channel.send("Please wait...").then(msg => {
              steam.getUserSummary(args[1]).then(result => {
                  steam.getUserBans(args[1]).then(ban_info => {
                      var embed = new Discord.MessageEmbed();
                      embed.setColor('RANDOM');
                      embed.setTitle(`${args[1]} - INFO:`);
                      embed.setThumbnail(result.avatar.large);
                      embed.addFields
                      (
                          { name: "Nickname:", value: `${result.nickname}` },
                          { name: "Steam ID:", value: `${result.steamID}` },
                          { name: "URL:", value: `${result.url}` },
                          { name: "Member since:", value: `${TimestampConvert(result.created)}` },
                          { name: "Last login:", value: `${TimestampConvert(result.lastLogOff)}` },
                          { name: "Country code:", value: `${result.countryCode}` }
                      );
                      if(ban_info.vacBanned == false) {
                          embed.addField("VAC Ban:", "no");
                      }
                      else {
                          embed.addField("VAC ban:", "yes");
                          embed.addField("Total VAC bans:", ban_info.vacBans);
                      }
                      msg.delete();
                      message.channel.send(embed);
                  });
              }).catch(() => {
                  msg.delete();
                  message.channel.send("Invalid steam ID provided.");
              });
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "steamlookup [Steam Account ID]```");
        }
        if(args[0] == `${PREFIX}ytblookup`){
          if(args[1] && args.slice(2).join(" ")) {
            message.channel.send("Please wait...").then(msg => {
              if(args[1] == "channel") {
                YTBScrape.search(args.slice(2).join(" "), { type: "channel" }).then(r => {
                    YouTubeScrapper.getChannelInfo(r[0].id).then(result => {
                        var description = result.description;
                        if(description == "") description = "null";
                        var embed = new Discord.MessageEmbed();
                        embed.setColor('RANDOM');
                        embed.setTitle(`${args.slice(3).join(" ")} - INFO:`);
                        embed.setThumbnail(result.authorThumbnails[2].url);
                        embed.addFields
                        (
                            { name: "Name:", value: `${result.author}` },
                            { name: "ID:", value: `${result.authorId}` },
                            { name: "URL:", value: `${result.authorUrl}` },
                            { name: "Subscribers:", value: `${result.subscriberText}` },
                            { name: "Description:", value: `${description}` }
                        );
                        msg.delete();
                        message.channel.send(embed);
                    });
                }).catch(function() { 
                    msg.delete();
                    message.channel.send("Unknown channel.");
                });
              }
              else if(args[1] == "video") { 
                  YTBScrape.search(args.slice(2).join(" "), { type: "video" }).then(r => {
                      YTBScrape.getVideo(r[0].id).then(result => {
                          var embed = new Discord.MessageEmbed();
                          embed.setColor('RANDOM');
                          embed.setTitle(`${result.id} - INFO:`);
                          embed.setThumbnail(result.thumbnail);
                          embed.addFields
                          (
                              { name: "Title:", value: `${result.title}` },
                              { name: "Author:", value: `${result.channel.name}` },
                              { name: "Author URL:", value: `${result.channel.url}` },
                              { name: "Duration:", value: `${secondsToHms(result.duration)}` },
                              { name: "Upload date:", value: `${result.uploadDate}` },
                              { name: "Views:", value: `${result.viewCount}` },
                              { name: "Likes:", value: `${result.likeCount}` },
                              { name: "Dis likes:", value: `${result.dislikeCount}` }
                          );
                          msg.delete();
                          message.channel.send(embed);
                      });
                  }).catch(function() { 
                      msg.delete();
                      message.channel.send("Unknown video.");
                  });
              }
              else {
                  msg.delete();
                  message.channel.send("Invalid values for get value.");
              }
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "ytblookup [Channel/Video] [Some informations]```");
        }
        if(args[0] == `${PREFIX}membercounter`){
          var role = message.mentions.roles.first();
          if(!role) {
            var string = {}, count = 0;
            message.guild.roles.cache.forEach((r) => {
              count++;
              string[count] = `${r} (${message.guild.members.cache.filter(m => m.roles.cache.has(r.id)).size} Members)`;
            });
            if(count == 0) message.channel.send("No roles!");
            else {

              function GetJumiJuma(start, end){
                var string2;
                for(var i = start; i <= end; i++){
                  if(string[i]) {
                    string2 = `${string2 ? string2 += "\n"+string[i] : string2= string[i]}`;
                  }
                }
                var embed = new Discord.MessageEmbed();
                embed.setColor('RANDOM');
                embed.setDescription(string2);
                message.channel.send(embed);
              }

              GetJumiJuma(1, Math.floor(count/2)); 
              GetJumiJuma(Math.floor(count/2)+1, count);

              console.log(HowManyFrom1To2(Math.floor(count/2), count))

              // Nush, o functie destul de folositoare daca vrei sa calculezi cate numere ai de la la un numar dat, pana la alt number :)
              function HowManyFrom1To2(one, two){
                var many=0;
                for(var i = one; i <= two;i++){
                  many++;
                }
                return many;
              }
            }
          }
          else {
            if(message.member.guild.me.hasPermission("MANAGE_CHANNELS")) {
              con.query("SELECT * FROM role_counter WHERE guild_id = ? AND role_id = ?", [message.guild.id, role.id], function(err, result) {
                if(result == 0) {
                  EnableRoleCounterFor(message.guild.id, role.id);
                  var embed = new Discord.MessageEmbed();
                  embed.setAuthor(`✅ Role counter enabled for role: ${role.name}`);
                  embed.setColor("00FF00");
                  message.channel.send(embed);
                }
                else {
                  GetGuildSettings(message.guild.id, "role_counter", function(result) {
                    if(result != 0) {
                      DisableRoleCounterFromThisCategory(message.guild.id, role.id, result);
                      var embed = new Discord.MessageEmbed();
                      embed.setAuthor(`❌ Role counter disabled for role: ${role.name}`);
                      embed.setColor("FF0000");
                      message.channel.send(embed);
                    }
                    else message.channel.send("Error from MySQL...");
                  });
                }
              });
            }
            else message.channel.send("I can't create a channel! I need 'MANAGE_CHANNELS' permission!");
          }
        }
        if(args[0] == `${PREFIX}serverinfo`){
          var embed = new Discord.MessageEmbed();
          embed.setTitle(`SERVER: INFO`);
          embed.setColor('RANDOM');
          embed.setThumbnail(message.guild.iconURL({dynamic : true, size : 2048}));
          embed.addField("Name:", message.guild.name);
          embed.addField("ID:", message.guild.id);
          embed.addField("Owner:", message.guild.owner.user.tag);
          embed.addField("Members:", `${message.guild.members.cache.size} (🟢 ${message.guild.members.cache.filter(m => m.presence.status == "online").size} ⛔ ${message.guild.members.cache.filter(m => m.presence.status == "dnd").size} 🌙 ${message.guild.members.cache.filter(m => m.presence.status == "idle").size} ⚪ ${message.guild.members.cache.filter(m => m.presence.status == "offline").size})`);
          embed.addField("Roles:", message.guild.roles.cache.size);
          embed.addField("Channels:", `${message.guild.channels.cache.size} (category: ${message.guild.channels.cache.filter(c => c.type == "category").size}, text: ${message.guild.channels.cache.filter(c => c.type == "text").size}, voice: ${message.guild.channels.cache.filter(c => c.type == "voice").size})`);
          embed.addField("Created at:", message.guild.createdAt);
          embed.addField("Region:", message.guild.region);
          message.channel.send(embed);
        }
        if(args[0] == `${PREFIX}serverstats`){
          //if(IsOwner(message.author.id)) {
            if(args[1]){
              var guild = bot.guilds.cache.get(args[1]);
              if(guild){
                GetTotalMessagesInGuild(guild.id, (total_messages) => {
                  GetGuildSettings(guild.id, "total_members_joined", (total_members_join) => {
                    GetGuildSettings(guild.id, "total_members_left", (total_members_left) => {
                      var embed = new Discord.MessageEmbed();
                      embed.setColor('RANDOM');
                      embed.setTitle(`Guild: ${guild.name} statistics:`);
                      embed.addField("Total Users:", guild.members.cache.size);
                      embed.addField("Total Members", guild.members.cache.filter(m => !m.user.bot).size);
                      embed.addField("Total Bots:", guild.members.cache.filter(m => m.user.bot).size);
                      embed.addField("Total messages:", total_messages);
                      embed.addField("Total members join:", total_members_join);
                      embed.addField("Total members left:", total_members_left);
                      message.channel.send(embed);
                    });
                  });
                });
              }
              else message.channel.send("Invalid guild ID!");
            }
            else message.channel.send("```Syntax: " + PREFIX + "servrstats [Guild ID]```");
          //}
        }
        if(args[0] == `${PREFIX}userinfo`)
        {
            var user;
            user = message.mentions.users.first() || bot.users.cache.get(args[2]);
            rMember = message.guild.member(message.mentions.users.first() || bot.users.cache.get(args[2]))
            
            if(!user) 
            {
                user = message.author;
                rMember = message.guild.member(user);
                getinfouser(user, rMember);
            }
            else { getinfouser(user, rMember); }
            
            function getinfouser(user, rMember) 
            {
                if(user.bot) isbot = "Yes";
                else isbot = "No"
                
                var game = user.presence.activities[0] ? user.presence.activities[0].name : "None";
                
                const member = message.guild.member(user);
                let nickname = member.nickname != undefined && member.nickname != null ? member.nickname : "None";
                let role = member.roles.highest.id;
                
                const embed = new Discord.MessageEmbed()
                embed.setTitle(`${member.displayName}'s user informations:`)
                embed.setThumbnail(user.displayAvatarURL({dynamic : true, size : 2048}))
                embed.setColor('RANDOM')
                embed.addFields 
                (
                    { name: `${user.tag}`, value: "<@" + user.id + ">", inline: true },
                    { name: "ID:", value: `${user.id}`, inline: true },
                    { name: "Nickname:", value: `${nickname}`, inline: true },
                    { name: "Bot:", value: `${isbot}`, inline: true },
                    { name: "Joined server on:", value: `${moment.utc(rMember.joinedAt).format("YYYY-MM-DD")}`, inline: true },
                    { name: "Created account on:", value: `${moment.utc(user.createdAt).format("YYYY-MM-DD")}`, inline: true },
                    { name: "Highest role:", value: "<@&" + role + ">", inline: true }
                )
                message.channel.send(embed);
            }
        }
        if(args[0] == `${PREFIX}avatar`) {
          var user;
          if(args.slice(1).join(" ")) user = message.mentions.users.first() || await bot.users.fetch(args[1]);
          else user = await bot.users.fetch(message.author.id);
          var member = await message.guild.member(user); 
          if(!user) user = message.author;
          var embed = new Discord.MessageEmbed();
          embed.setColor('RANDOM');
          embed.setImage(user.displayAvatarURL({dynamic : true, size : 2048}));
          message.channel.send(embed);
      }
        if(args[0] == `${PREFIX}invites`){
          con.query("SELECT * FROM users_data WHERE guild_id = ? AND user_id = ?", [message.guild.id, message.author.id], function(err, result){
            if(result != 0){
              var invited_by = bot.users.cache.get(result[0].invited_by);
              var embed = new Discord.MessageEmbed();
              embed.setTitle(`${message.author.username}'s invites:`);
              embed.setColor('RANDOM');
              embed.addField("Invited by:", `**${invited_by ? invited_by.tag : 'Unknown'}**`)
              embed.addField("Total invites:", result[0].total_invites);
              embed.addField("Success invites:", result[0].success_invites);
              message.channel.send(embed);
            }
            else message.channel.send("You don't have any invites!");
          });
        } 
        if(args[0] == `${PREFIX}invitelist`){
          con.query("SELECT * FROM users_data WHERE guild_id = ? AND invited_by = ?", [message.guild.id, message.author.id], function(err, result){
            var string, count = 0;
            if(result != 0) {
              for(var i = 0; i < result.length; i++){
                var user = bot.users.cache.get(result[i].user_id);
                count++;
                string = `${string ? user ? string += "\n" + count + "." + " " + "***" + user.tag + "***" : 'Not yet exists' : user ? string = count + "." + " " + "***" + user.tag + "***" : 'Not yet exists'}`;
              }
            }
            if(string){
              var embed = new Discord.MessageEmbed();
              embed.setColor('RANDOM');
              embed.setTitle("Invited users:");
              embed.setDescription(string);
              message.channel.send(embed);
            }
            else{
              message.channel.send("You don't invited any users!");
            }
          });
        }
        /*if(args[0] == `${PREFIX}convert`){
          if(args[1]){
            if(!Current_Downloading_mp3[message.author.id]){
              var YD = new YoutubeMp3Downloader({
                "ffmpegPath": "",       
                "outputPath": "/home/bot/ConvertedMusic",   
                "youtubeVideoQuality": "lowest",       
                "queueParallelism": 2,                 
                "progressTimeout": 2000                 
              });

              //Download video and save as MP3 file
              YD.download(args[1]);
              Current_Downloading_mp3[message.author.id] = true;

              var embed = new Discord.MessageEmbed();
              embed.setDescription("Checking video... Please wait!");
              embed.setColor("#ffcc00");
              message.channel.send(embed).then(msg => {
                YD.on("finished", function(err, data) {
                  embed.setDescription("Download finished!");
                  embed.setColor("#00FF00");
                  msg.edit(embed).then(msg =>{
                    msg.channel.send({ files: [data.file] }).then(() => {
                      delete Current_Downloading_mp3[message.author.id];
                      console.log(data.file);
                      if(fs.existsSync(data.file)) {
                        fs.unlinkSync(data.file);
                      }
                    });
                  });
                });

                YD.on("error", function(error) {
                  embed.setDescription("An error has occurred!");
                  embed.setColor("#FF0000");
                  msg.edit(embed);
                  delete Current_Downloading_mp3[message.author.id];
                  console.log(error);
                });

                YD.on("progress", function(progress) {
                  console.log(JSON.stringify(progress));
                  embed.setDescription(`Downloading...\nEta: **${progress.progress.eta} seconds**\nSpeed: **${bytesToSize(progress.progress.speed)}/s**`);
                  embed.setColor("#c4ff4d");
                  msg.edit(embed);
                });
              });
            }
            else message.channel.send("You already converting a video...")
          }
          else message.channel.send("```Syntax: " + PREFIX + "convert [YouTube Link]```");
        }*/
        if(args[0] == `${PREFIX}speedtest`){
          if(IsOwner(message.author.id)) {
            var embed = new Discord.MessageEmbed();
            embed.setColor("#ffcc00");
            embed.setTitle("Speed Test");
            embed.setDescription("Starting a speed test... Please wait");
            message.channel.send(embed).then(msg => {
              (async () => {
                try {
                  var result = await speedTest({acceptLicense: true, acceptGdpr: true});
                  embed.setColor("#00FF00");
                  embed.setDescription("Result:");
                  embed.addField("Ping:", `${result.ping.latency}ms`);
                  embed.addField("Download:", bytesToSize(result.download.bytes));
                  embed.addField("Upload:", bytesToSize(result.upload.bytes));
                  embed.addField("Packet loss:", result.packetLoss);
                  msg.edit(embed);
                } 
                catch {
                  embed.setColor("#FF0000");
                  embed.setDescription("An error has occurred!");
                  msg.edit(embed);
                }
              })();
            });
          }
        }
        /*if(args[0] == `${PREFIX}massdm`) {
          if(IsOwner(message.author.id)) {
            if(args.slice(1).join(" ")){
              var embed = new Discord.MessageEmbed();
              embed.setColor("ffcc00");
              embed.setTitle("Mass DM");
              embed.setDescription("Sending DM to everyone...");
              message.channel.send(embed).then(msg => {
                var users = {}, total_users = 0, success_send = 0, failed_send = 0;
                message.guild.members.cache.forEach((u) => {
                  total_users++;
                  users[total_users] = u;
                });
                for(var i = 1; i <= total_users; i++) {
                  if(users[i]){
                    users[i].send(args.slice(1).join(" ")).then(() => {
                      success_send++;
                    }).catch(() => {
                      failed_send++;
                    });
                  }
                }
                setTimeout(() => {
                  var embed = new Discord.MessageEmbed();
                  embed.setColor("00FF00");
                  embed.setTitle("Mass DM - Result:");
                  embed.addField("Text:", args.slice(1).join(" "));
                  embed.addField("Total users:", total_users);
                  embed.addField("Success send:", success_send);
                  embed.addField("Failed send:", failed_send);
                  msg.edit(embed);
                }, 3750);
              });
            }
            else message.channel.send("```Syntax: " + PREFIX + "massdm [Text]```")
          }disabled pentru ca discord.
        }*/ 
        if(args[0] == `${PREFIX}youtubeannounce`){
          GetGuildSettings(message.guild.id, "ytb_announce_channel", (result) => {
            if(result != "0") {
              if(args[1]){
                YouTubeScrapper.getChannelInfo(args[1]).then(() => {
                  con.query("SELECT * FROM guild_youtube_announces WHERE guild_id = ? AND youtube_channel_id = ?", [message.guild.id, args[1]], function(err, result){
                    if(result == 0){
                      YouTubeScrapper.getChannelVideos(args[1]).then(youtube_result => {
                        con.query("SELECT * FROM guild_youtube_video_links WHERE guild_id = ? AND video_id = ?", [message.guild.id, youtube_result.items[0].videoId], function(err2, result){
                          if(result == 0){
                            con.query("INSERT INTO guild_youtube_video_links (guild_id, video_id) VALUES(?, ?)", [message.guild.id, youtube_result.items[0].videoId]);
                          }
                        });
                        con.query("INSERT INTO guild_youtube_announces (guild_id, youtube_channel_id) VALUES(?, ?)", [message.guild.id, args[1]]);
                        message.channel.send("YouTube announce for channel ***" + args[1] + "*** has been added!");
                      });
                    }
                    else {
                      con.query("DELETE FROM guild_youtube_announces WHERE guild_id = ? AND youtube_channel_id = ?", [message.guild.id, args[1]]);
                      message.channel.send("YouTube announce for channel ***" + args[1] + "*** has been removed!");
                    }
                  });
                }).catch(() => {
                  message.channel.send("Invalid YouTube channel ID!");
                });
              }
              else message.channel.send("```Syntax: " + PREFIX + "youtubeannounce [Youtube Channel ID]```");
            }
            else message.channel.send("**YouTube channel Announce** not enabled! Please use **mm!settings** to enable it!");
          });
        } 
        if(args[0] == `${PREFIX}leaderboard`){
          if(args[1]=="invites"){
            con.query("SELECT * FROM users_data WHERE guild_id = ? AND total_invites > ? ORDER BY total_invites DESC LIMIT 10", [message.guild.id, 0], function(err, result) {
              if(result != 0){
                var string; 
                for(var i = 0; i < result.length; i++)
                {
                  string = string ? 
                  string += `\n${message.guild.members.cache.get(result[i].user_id) 
                    ? `${i+1}. ${bot.users.cache.get(result[i].user_id).tag} (Invites: ${result[i].total_invites} | Success Invites: ${result[i].success_invites})`
                    : `${i+1}. This user no longer member (Invites: ${result[i].total_invites} | Success Invites: ${result[i].success_invites})```}` 
                  : 
                  string = `${message.guild.members.cache.get(result[i].user_id) 
                    ? `${i+1}. ${bot.users.cache.get(result[i].user_id).tag} (Invites: ${result[i].total_invites} | Success Invites: ${result[i].success_invites})`
                    : `${i+1}. This user no longer member (Invites: ${result[i].total_invites} | Success Invites: ${result[i].success_invites})```}`
                  ;
                }
                if(string){
                  var embed = new Discord.MessageEmbed();
                  embed.setColor('RANDOM');
                  embed.setTitle(`${message.guild.name} - LeaderBoard (Invites)`);
                  embed.setDescription(string);
                  message.channel.send(embed);
                }
                else message.channel.send("No LeaderBoard users for this category!")
              }
              else message.channel.send("No LeaderBoard users for this category!");
            });
          }
          else if(args[1]=="voices"){
            con.query("SELECT * FROM users_data WHERE guild_id = ? AND total_voice_seconds > ? ORDER BY total_voice_seconds DESC LIMIT 10", [message.guild.id, 0], function(err, result){
              if(result != 0){
                var string; 
                for(var i = 0; i < result.length; i++)
                {
                  var Total_Voice_Connection = secondsToHms(result[i].total_voice_seconds);
                  string = string ? 
                  string += `\n${message.guild.members.cache.get(result[i].user_id) 
                    ? `${i+1}. ${bot.users.cache.get(result[i].user_id).tag} (Total voice time: ${Total_Voice_Connection})` 
                    : `${i+1}. This user not longer member (Total voice time: ${Total_Voice_Connection})`}`
                  :
                  string = `${message.guild.members.cache.get(result[i].user_id)
                    ? `${i+1}. ${bot.users.cache.get(result[i].user_id).tag} (Total voice time: ${Total_Voice_Connection})` 
                    : `${i+1}. This user not longer member (Total voice time: ${Total_Voice_Connection})`}`
                  ;
                }
                if(string){
                  var embed = new Discord.MessageEmbed();
                  embed.setColor('RANDOM');
                  embed.setTitle(`${message.guild.name} - LeaderBoard (Voices)`);
                  embed.setDescription(string);
                  message.channel.send(embed);
                }
                else message.channel.send("No LeaderBoard users for this category!")
              }
              else message.channel.send("No LeaderBoard users for this category!");
            });
          }
          else if(args[1]=="messages"){
            con.query("SELECT * FROM users_data WHERE guild_id = ? AND total_message_send > ? ORDER BY total_message_send DESC LIMIT 10", [message.guild.id, 0], function(err, result){
              if(result != 0){
                var string; 
                for(var i = 0; i < result.length; i++)
                {
                  string = string ? 
                  string += `\n${message.guild.members.cache.get(result[i].user_id) 
                    ? `${i+1}. ${bot.users.cache.get(result[i].user_id).tag} (Total messages: ${result[i].total_message_send})` 
                    : `${i+1}. This user not longer member (Total messages: ${result[i].total_message_send})`}`
                  :
                  string = `${message.guild.members.cache.get(result[i].user_id)
                    ? `${i+1}. ${bot.users.cache.get(result[i].user_id).tag} (Total messages: ${result[i].total_message_send})` 
                    : `${i+1}. This user not longer member (Total messages: ${result[i].total_message_send})`}`
                  ;
                }
                if(string){
                  var embed = new Discord.MessageEmbed();
                  embed.setColor('RANDOM');
                  embed.setTitle(`${message.guild.name} - LeaderBoard (Messages)`);
                  embed.setDescription(string);
                  message.channel.send(embed);
                }
                else message.channel.send("No LeaderBoard users for this category!")
              }
              else message.channel.send("No LeaderBoard users for this category!");
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "leaderboard [Invites/Voices/Messages]```");
        }

        //===================
        // => Fun
        //===================
        if(args[0] == `${PREFIX}8ball`){
          message.channel.send("What do you want to ask the 8ball?");
          eight_ball_started[`${message.author.id}`+`${message.channel.id}`] = true;
        }

        //===================
        // => Users currency
        //===================
        if(args[0] == `${PREFIX}stats`){
          var user = message.mentions.users.first();
          if(!user) user = message.author;
          con.query("SELECT * FROM users WHERE user_id = ?", [user.id], function(err, result){
            if(result != 0){
              GetUserRowFromThisGuild(message.guild.id, user.id, "xp", (xp) => {
                GetUserRowFromThisGuild(message.guild.id, user.id, "level", (level) => {
                  GetUserRowFromThisGuild(message.guild.id, user.id, "warns", (warns) => {
                    var age;
                    if(result[0].birthday_month != 0 && result[0].birthday_day != 0 && result[0].birthday_year != 0) {
                      var date = new Date(`${result[0].birthday_month}/${result[0].birthday_day}/${result[0].birthday_year}`);
                      var month_diff = Date.now() - date.getTime();
                      var age_dt = new Date(month_diff); 
                      var year = age_dt.getUTCFullYear();
                      age = Number(Math.abs(year - 1970));
                    }
                    var embed = new Discord.MessageEmbed();
                    embed.setColor('RANDOM');
                    embed.setTitle(`${user.tag}'s stats:`);
                    embed.addField("Coins:", `:coin: ${numberWithCommas(result[0].coins)}`);
                    embed.addField("Coins (In Bank):", `💳 ${numberWithCommas(result[0].coins_in_bank)}`);
                    embed.addField("XP:", `🏆 ${xp}/${level != 0 ? level * 100 : '50'}`);
                    embed.addField("Level:", `🆙 ${level}`);
                    embed.addField("Warns:", `${warns}/3`);
                    embed.addField("Age:", age ? age : 'Not seted');
                    message.channel.send(embed); 
                  });
                });
              });
            }
          });
        }
        if(args[0] == `${PREFIX}deposit`){
          if(!isNaN(args[1])){
            con.query("SELECT * FROM users WHERE user_id = ?", [message.author.id], function(err, result){
              if(result != 0){
                var coins = result[0].coins;
                var coins_in_bank = result[0].coins_in_bank;
                if(coins >= args[1]) {
                    var new_coins = Number(coins) - Number(args[1]);
                    var new_coins_in_bank = Number(coins_in_bank) + Number(args[1]);
                    message.channel.send(`**${numberWithCommas(args[1])}** coins deposited. New bank amount: **${numberWithCommas(new_coins_in_bank)}**`);
                    UpdateUser(message.author.id, "coins", new_coins);
                    UpdateUser(message.author.id, "coins_in_bank", new_coins_in_bank);
                }
                else message.channel.send("You don't have that many coins.");
              }
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "deposit [Coins Value]```");
        }
        if(args[0] == `${PREFIX}withdraw`){
          if(!isNaN(args[1])){
            con.query("SELECT * FROM users WHERE user_id = ?", [message.author.id], function(err, result) {
              if(result != 0) {
                var coins_in_bank = result[0].coins_in_bank;
                var coins = result[0].coins;
                if(coins_in_bank >= args[1]) {
                    var new_coins_in_bank = Number(coins_in_bank) - Number(args[1]);
                    var new_coins = Number(coins) + Number(args[1]);
                    message.channel.send(`**${numberWithCommas(args[1])}** coins withdrawed. New pocket amount: **${numberWithCommas(new_coins)}**`);
                    UpdateUser(message.author.id, "coins_in_bank", new_coins_in_bank);
                    UpdateUser(message.author.id, "coins", new_coins);
                }
                else message.channel.send("You don't have that many coins in your bank.");
              }
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "withdraw [Coins Value]```");
        }
        if(args[0] == `${PREFIX}slots`){
          if(args[1]) {
            if(args[1] >= 100) {
              con.query("SELECT * FROM users WHERE user_id = ?", [message.author.id], function(err, result) {
                var coins = result[0].coins;
                if(coins >= args[1]) {
                  var icon = {};
                  icon[1] = ":apple:";
                  icon[2] = ":cherries:";
                  icon[3] = ":tangerine:";
                  icon[4] = ":watermelon:";
                  icon[5] = ":strawberry:";
                  icon[6] = ":seven:";
                  icon[7] = ":grapes:";
                  var selected_icon = {};
                  for(var i = 1; i < 10; i++) {
                      selected_icon[i] = icon[Math.floor(Math.random() * 7) + 1];
                  }
                  var input = `${selected_icon[1]} | ${selected_icon[2]} | ${selected_icon[3]}\n\n${selected_icon[4]} | ${selected_icon[5]} | ${selected_icon[6]} <\n\n${selected_icon[7]} | ${selected_icon[8]} | ${selected_icon[9]}`;
                  var status, new_win = 0, new_coins_after = 0;
                  // -> Full win (3x)
                  if(
                      selected_icon[4] == selected_icon[5] &&
                      selected_icon[5] == selected_icon[6]) {
                      new_win = args[1] * 3;
                      new_coins_after = coins + (args[1] * 3);
                      status = `<@${message.author.id}> has used ${numberWithCommas(args[1])} Coins and won ${numberWithCommas(new_win)} Coins ! :D`;
                  }
                  // -> Normal win (2x)
                  else if(
                      selected_icon[4] == selected_icon[5] ||
                      selected_icon[5] == selected_icon[6] ||
                      selected_icon[4] == selected_icon[6]) {
                      new_win = args[1] * 2;
                      new_coins_after = coins + (args[1] * 2);
                      status = `<@${message.author.id}> has used ${numberWithCommas(args[1])} Coins and won ${numberWithCommas(new_win)} Coins ! :D`;
                  }
                  // -> Lose
                  else {
                      new_coins_after = coins - args[1];
                      status = `<@${message.author.id}> has used ${numberWithCommas(args[1])} Coins and lost ${numberWithCommas(args[1])} Coins ! :(`;
                  }
                  UpdateUser(message.author.id, "coins", new_coins_after);
                  var embed = new Discord.MessageEmbed();
                  embed.setColor('RANDOM');
                  embed.setTitle("[ :slot_machine: SLOTS ]");
                  embed.setDescription("**------------------**\n" + input + "\n**------------------**" + `\n${status}`);
                  embed.setFooter(`${numberWithCommas(new_coins_after)} Coins now in pocket`);
                  message.channel.send(embed);
                }
                else message.channel.send("You don't have enough Coins!")
              });
            }
            else message.channel.send("You must bet more than 100 Coins !");
          }
          else message.channel.send("```Syntax: " + PREFIX + "slots [Amount]```");
        }
        if(args[0] == `${PREFIX}daily`){
          con.query("SELECT * FROM users WHERE user_id = ?", [message.author.id], function(err, result) {
            var daily = result[0].daily;
            var coins = result[0].coins;
            if(daily < Math.floor(Date.now() / 1000)) {
              UpdateUser(message.author.id, "daily", Math.floor(Date.now() / 1000) + 86400);
              UpdateUser(message.author.id, "coins", coins+1000);
              message.channel.send(`+1000 Coins ! If you want to claim it again, you can come back in **24 hours** !`);
            }
            else {
                var difference = timeDiffCalc(new Date(daily * 1000), new Date(Date.now()));
                message.channel.send(`Hey ! You've already claimed your daily, silly ! You can claim it again in: **${difference}** !`);
            }
          });
        }
        if(args[0] == `${PREFIX}set`){
          if(IsOwner(message.author.id)) {
            var user = message.mentions.users.first();
            if(!user) user = bot.users.cache.get(args[2]);
            if(args[1] && user && !isNaN(args[3])) {
              switch(args[1]){
                case 'coins':{
                  message.channel.send(`Coins updated for **${user.tag}** to value: **${args[3]}**`);
                  UpdateUser(user.id, "coins", args[3]);
                  break;
                }
                case 'daily':{
                  message.channel.send(`Daily updated for **${user.tag}** to value **${args[3]}**`);
                  UpdateUser(user.id, "daily", args[3]);
                  break;
                }
                default: {
                  message.channel.send("Invalid Option!");
                  break;
                }
              }
            }
            else message.channel.send("```Syntax: " + PREFIX + "set [Coins/Daily] [Mentioned User / User ID] [Value]```");
          }
        }
        /*if(args[0] == `${PREFIX}closeticket`) {
          if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("No permission");
          if(`${message.channel.name}`.startsWith("ticket-")) {
            var embed = new Discord.MessageEmbed();
            embed.setColor("RANDOM");
            embed.setDescription("Removing ticket channel in 5 seconds...");
            message.channel.send(embed);
            setTimeout(() => {
              var c = bot.channels.cache.get(message.channel.id);
              if(c) {
                c.delete();
              }
            }, 5000);
          } 
          else message.channel.send("This is not a ticket channel");
        }
        if(args[0] == `${PREFIX}setupticket`) {
          if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("No permission");
          var channel = message.mentions.channels.first() ? message.mentions.channels.first() : message.guild.channels.cache.get(args[1]);
          if(channel) {
            con.query("SELECT * FROM tickets_guilds WHERE guild_id = ? AND channel_id = ?", [message.guild.id, channel.id], function(err, result) {
              var embed = new Discord.MessageEmbed();
              embed.setColor("RANDOM");
              if(result != 0) {
                embed.setDescription("Removing ticket variable...");
                message.channel.send(embed).then(msg => {
                  message.guild.channels.cache.get(result[0].channel_id).messages.fetch(result[0].message_id).then(message => {
                    message.delete();
                    embed.setDescription("Successfully removed ticket variable...");
                    con.query("DELETE FROM tickets_guilds WHERE guild_id = ? AND channel_id = ?", [message.guild.id, channel.id]);
                    msg.edit(embed);
                  });
                });
              }
              else {
                message.channel.send("Now type in chat your ticket message").then(msg => {
                  in_ticket_progress[`${message.channel.id}` + `${message.author.id}`] = {
                    channel: channel,
                    msg_what_need_edit: msg
                  }
                });
              }
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "setupticket [Channel ID/Mention]```");
              
        }*/
        //====================
        // => Fun Commands
        //====================
        /*if(args[0] == `${PREFIX}meme`){
          snekfetch.get("https://meme-api.herokuapp.com/gimme").then(result => { 
            var embed = new Discord.MessageEmbed();
            embed.setColor('RANDOM');
            embed.setTitle(`${result.body.title}`);
            embed.setImage(`${result.body.url}`);
            message.channel.send(embed);
          });
        }
        if(args[0] == `${PREFIX}youtube`){
          var user = message.mentions.users.first();
          if(user && args.slice(2).join(" ")){
            message.channel.send("Please wait...").then(msg => {
              var avatar = user.displayAvatarURL({ format: "png" });
              memer.youtube(avatar, user.username, args.slice(2).join(" ")).then(image => {
                var attachment = new Discord.MessageAttachment(image, "youtube.png");
                msg.delete();
                message.channel.send(attachment);
              }).catch(() => {
                return;
              });
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "youtube [Mentioned user] [Text]```");
        }
        if(args[0] == `${PREFIX}trash`){
          var user = message.mentions.users.first();
          if(user){
            message.channel.send("Please wait...").then(msg => {
              var avatar = user.displayAvatarURL({ format: "png" });
              memer.trash(avatar).then(image => {
                var attachment = new Discord.MessageAttachment(image, "trash.png");
                msg.delete();
                message.channel.send(attachment);
              }).catch(() => {
                return;
              });
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "trash [Mentioned user]```");
        }
        if(args[0] == `${PREFIX}satan`){
          var user = message.mentions.users.first();
          if(user){
            message.channel.send("Please wait...").then(msg => {
              var avatar = user.displayAvatarURL({ format: "png" });
              memer.satan(avatar).then(image => {
                var attachment = new Discord.MessageAttachment(image, "satan.png");
                msg.delete();
                message.channel.send(attachment);
              }).catch(() => {
                return;
              });
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "satan [Mentioned user]```");
        }
        if(args[0] == `${PREFIX}shit`){
          if(args.slice(1).join(" ")){
            message.channel.send("Please wait...").then(msg => {
              memer.shit(args.slice(1).join(" ")).then(image => {
                var attachment = new Discord.MessageAttachment(image, "shit.png");
                msg.delete();
                message.channel.send(attachment);
              }).catch(() => {
                return;
              });
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "shit [Text]```");
        }
        if(args[0] == `${PREFIX}roblox`){
          var user = message.mentions.users.first();
          if(user){
            message.channel.send("Please wait...").then(msg => {
              var avatar = user.displayAvatarURL({ format: "png" });
              memer.roblox(avatar).then(image => {
                var attachment = new Discord.MessageAttachment(image, "roblox.png");
                msg.delete();
                message.channel.send(attachment);
              }).catch(() => {
                return;
              });
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "roblox [Mentioned user]```");
        }
        if(args[0] == `${PREFIX}wanted`){
          var user = message.mentions.users.first();
          if(user){
            message.channel.send("Please wait...").then(msg => {
              var avatar = user.displayAvatarURL({ format: "png" });
              memer.wanted(avatar).then(image => {
                var attachment = new Discord.MessageAttachment(image, "wanted.png");
                msg.delete();
                message.channel.send(attachment);
              }).catch(() => {
                return;
              });
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "wanted [Mentioned user]```");
        }
        if(args[0] == `${PREFIX}hitler`){
          var user = message.mentions.users.first();
          if(user){
            message.channel.send("Please wait...").then(msg => {
              var avatar = user.displayAvatarURL({ format: "png", size: 1800 });
              memer.hitler(avatar).then(image => {
                var attachment = new Discord.MessageAttachment(image, "hitler.png");
                msg.delete();
                message.channel.send(attachment);
              }).catch(() => {
                return;
              });
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "hitler [Mentioned user]```");
        }
        /*if(args[0] == `${PREFIX}brazzers`){
          var user = message.mentions.users.first();
          if(user){
            message.channel.send("Please wait...").then(msg => {
              var avatar = user.displayAvatarURL({ format: "png", dynamic : true, size : 2048 });
              console.log(avatar);
              memer.brazzers(avatar).then(image => {
                var attachment = new Discord.MessageAttachment(image, "brazzers.png");
                msg.delete();
                message.channel.send(attachment);
              }).catch(() => {
                return;
              });
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "brazzers [Mentioned user]```");
        /
        if(args[0] == `${PREFIX}keepdistance`){
          if(args.slice(1).join(" ")){
            message.channel.send("Please wait...").then(msg => {
              memer.keepdistance(args.slice(1).join(" ")).then(image => {
                var attachment = new Discord.MessageAttachment(image, "keepdistance.png");
                msg.delete();
                message.channel.send(attachment);
              }).catch(() => {
                return;
              });
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "keepdistance [Text]```");
        }
        if(args[0] == `${PREFIX}delete`){
          var user = message.mentions.users.first();
          if(user){
            message.channel.send("Please wait...").then(msg => {
              var avatar = user.displayAvatarURL({ format: "png" });
              memer.delete(avatar).then(image => {
                var attachment = new Discord.MessageAttachment(image, "delete.png");
                msg.delete();
                message.channel.send(attachment);
              }).catch(() => {
                return;
              });
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "delete [Mentioned user]```");
        }
        if(args[0] == `${PREFIX}cry`){
          if(args.slice(1).join(" ")){
            message.channel.send("Please wait...").then(msg => {
              memer.cry(args.slice(1).join(" ")).then(image => {
                var attachment = new Discord.MessageAttachment(image, "cry.png");
                msg.delete();
                message.channel.send(attachment);
              }).catch(() => {
                return;
              });
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "cry [Text]```");
        }
        if(args[0] == `${PREFIX}fakenews`){
          var user = message.mentions.users.first();
          if(user){
            message.channel.send("Please wait...").then(msg => {
              var avatar = user.displayAvatarURL({ format: "png" });
              memer.fakenews(avatar).then(image => {
                var attachment = new Discord.MessageAttachment(image, "fakenews.png");
                msg.delete();
                message.channel.send(attachment);
              }).catch(() => {
                return;
              });
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "fakenews [Mentioned user]```");
        }
        if(args[0] == `${PREFIX}cancer`){
          var user = message.mentions.users.first();
          if(user){
            message.channel.send("Please wait...").then(msg => {
              var avatar = user.displayAvatarURL({ format: "png" });
              memer.cancer(avatar).then(image => {
                var attachment = new Discord.MessageAttachment(image, "cancer.png");
                msg.delete();
                message.channel.send(attachment);
              }).catch(() => {
                return;
              });
            });
          }
          else message.channel.send("```Syntax: " + PREFIX + "cancer [Mentioned user]```");
        }*/
        if(args[0] == `${PREFIX}botsettings`)
        {
          message.channel.send("Checking permissions...").then((msg) => {
            if(message.author == 218808258205450240) 
            {
              con.query(`SELECT * FROM settings`, function(err, rows) {
              let embed = new Discord.MessageEmbed;
              embed.setTitle("Mighty BOT Settings")
              embed.setColor('RANDOM'); 
              if(rows[0].maintenance_mode == 0) {embed.addField("1️⃣ Maintenance Mode", "Click to enable maintenance mode.")} else {embed.addField("1️⃣ Maintenance Mode", "Maintenance mode enabled ! Click to disable !")}
              msg.edit("Please wait ! Gathering options...").then(msg2 => {
                msg2.react('1️⃣')
                .then(() => msg2.edit('',embed))
                .catch(() => console.error('One of the emojis failed to react.'));
                const filter = (reaction, user) => {
                  return ['1️⃣', '🏆'].includes(reaction.emoji.name) && user.id === message.author.id;
                };
                msg2.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
                .then(collected => {
                  const reaction = collected.first();
              
                  if (reaction.emoji.name === '1️⃣') 
                  {
                    if(rows[0].maintenance_mode == 0)
                    {
                      msg2.delete()
                      let maintenance_embed = new Discord.MessageEmbed;
                      maintenance_embed.setTitle("Choose a reason...")
                      maintenance_embed.setColor('RANDOM'); 
                      maintenance_embed.addField("1️⃣ Reason 1", "DB Errors occuring.")
                      maintenance_embed.addField("2️⃣ Reason 2", "Server transfer in progress.")
                      maintenance_embed.addField("3️⃣ Reason 3", "Huge database manipulation.")
                      maintenance_embed.addField("4️⃣ Reason 4", "Slow response from the hosting provider.")
                      maintenance_embed.addField("5️⃣ Reason 5", "DDOS Attack to the server.")
                      maintenance_embed.addField("🔄 Other reason", "Just input the reason..")
                      message.channel.send("Gathering options...").then(msg3 => {
                        msg3.react('1️⃣')
                        .then(() => msg3.react('2️⃣'))
                        .then(() => msg3.react('3️⃣'))
                        .then(() => msg3.react('4️⃣'))
                        .then(() => msg3.react('5️⃣'))
                        .then(() => msg3.react('🔄'))
                        .then(() => msg3.edit('',maintenance_embed))
                        .catch(() => console.error('One of the emojis failed to react.'));
                        const filter = (reaction, user) => {
                          return ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '🔄'].includes(reaction.emoji.name) && user.id === message.author.id;
                        };
                        msg3.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
                        .then(collected => {
                          const reaction = collected.first();
                          if(reaction.emoji.name === '1️⃣')
                          {
                            EditBOTSetting('maintenance_mode', '1')
                            EditBOTSetting('maintenance_reason', 'Database errors occuring constantly !')
                            Maintenance_Enabled = 1;
                            Maintenance_Reason = "Database errors occuring constantly !"
                            msg3.delete()
                            message.channel.send("Maintenance mode enabled !")
                          }
                          if(reaction.emoji.name === '2️⃣')
                          {
                            EditBOTSetting('maintenance_mode', '1')
                            EditBOTSetting('maintenance_reason', 'Server transfer in progress.')
                            Maintenance_Enabled = 1;
                            Maintenance_Reason = "Server transfer in progress."
                            msg3.delete()
                            message.channel.send("Maintenance mode enabled !")
                          }
                          if(reaction.emoji.name === '3️⃣')
                          {
                            EditBOTSetting('maintenance_mode', '1')
                            EditBOTSetting('maintenance_reason', 'Huge database manipulation.')
                            Maintenance_Enabled = 1;
                            Maintenance_Reason = "Huge database manipulation."
                            msg3.delete()
                            message.channel.send("Maintenance mode enabled !")
                          }
                          if(reaction.emoji.name === '4️⃣')
                          {
                            EditBOTSetting('maintenance_mode', '1')
                            EditBOTSetting('maintenance_reason', 'Slow response from the hosting provider.')
                            Maintenance_Enabled = 1;
                            Maintenance_Reason = "Slow response from the hosting provider."
                            msg3.delete()
                            message.channel.send("Maintenance mode enabled !")
                          }
                          if(reaction.emoji.name === '5️⃣')
                          {
                            EditBOTSetting('maintenance_mode', '1')
                            EditBOTSetting('maintenance_reason', 'DDOS Attack to the server.')
                            Maintenance_Enabled = 1;
                            Maintenance_Reason = "DDOS Attack to the server."
                            msg3.delete()
                            message.channel.send("Maintenance mode enabled !")
                          }
                          if(reaction.emoji.name === '🔄')
                          {
                            msg3.delete()
                            message.channel.send("Input the reason !")
                            Maintenance_Custom[message.author.id] = 1;
                          }
                        })
    
                      
                      })
                    }
                    else
                    {
                      EditBOTSetting('maintenance_mode', '0')
                      EditBOTSetting('maintenance_reason', ' ')
                      Maintenance_Enabled = 0;
                      Maintenance_Reason = ""
                      msg2.delete()
                      message.channel.send("Maintenance mode disabled !")
                    }
                  }
                })
              })
            })
          }
          else
          {
            msg.edit("Insufficient permissions !")
          }
          })
        }
        // =============================
        // => Music System
        // =============================
        if(args[0] == `${PREFIX}spotifyplay`) {
          if(GuildInfo.MusicPlayer.current_music_type[`${message.guild.id}`] == "youtube") return message.reply("I'm already playing a YouTube music. Disconnect me and try again.");
          if(!message.member.voice.channel) return message.reply("Voice channel required to use this command."); 
          if(!message.member.voice.channel.joinable) return message.reply("Please verify if I can join in your voice channel.");

          if(args.slice(1).join(" ")) {
            message.member.voice.channel.join().then(connection => {
              const url = args.slice(1).join(" ");
              if (!spdl.validateURL(url)) return message.reply('Invalid URL');
              spdl.getInfo(url).then(infos => {
                GuildInfo.MusicPlayer.connection[`${message.guild.id}`] = connection;
                PlaySound("spotify", message, infos);
              });
            });
          }
          else message.channel.send("```Syntax: mm!spotifyplay [URL]```");
        }
        if(args[0] == `${PREFIX}addplaylist`) {
          if(args.slice(1).join(" ")) {
            yts(args.slice(1).join(" "), (err, result) => {
              if(!result.videos[0]) return message.reply("No available results for your search.");
              else {
                var url = result.videos[0].url;
                con.query("SELECT * FROM youtube_playlist WHERE user_id = ? AND url = ?", [message.author.id, url], function(err, result) {
                  if(result == 0) {
                    con.query("INSERT INTO youtube_playlist (user_id, url) VALUES(?, ?)", [message.author.id, url], function(err, result) {
                      if(!err) {
                        message.channel.send("✅ added in your playlist. You can see it with command: **mm!myplaylist**");
                      }
                    });
                  }
                  else message.channel.send("This item already exists in your playlist.");
                });
              }
            });
          }
          else message.channel.send("```Syntax: mm!addplaylist [Music Name/Link]```");
        } 
        if(args[0] == `${PREFIX}removeplaylist`) {
          if(args[1]) {
            con.query("SELECT * FROM youtube_playlist WHERE id = ?", args[1], function(err, result) {
              if(result != 0) {
                if(result[0].user_id == message.author.id) {
                  con.query("DELETE FROM youtube_playlist WHERE id = ?", args[1], function(err, result) {
                    if(!err) {
                      message.channel.send("✅ removed selected item. You can see it with command: **mm!myplaylist**");
                    }
                  });
                } 
                else message.channel.send("❌ you are not the owner of this item.");
              }
              else message.channel.send("❌ this ID not exists.");
            });
          }
          else message.channel.send("```Syntax: mm!removeplaylist [ID]```");
        }
        if(args[0] == `${PREFIX}myplaylist`) {
          con.query("SELECT * FROM youtube_playlist WHERE user_id = ?", [message.author.id], function(err, result) {
            if(result != 0) {
              var embed = new Discord.MessageEmbed();
              embed.setColor("RANDOM");
              embed.setTitle(`Your playlist (${result.length} items)`);
              var string = "";
              for(var i = 0; i < result.length; i++) {
                string += `\n${i+1}. [**#${result[i].id}**] **${result[i].url}**`;
              }
              embed.setDescription(string);
              message.channel.send(embed);
            }
            else message.channel.send("❌ you don't have any items in your playlist. You can add items with command: **mm!addplaylist**");
          });
        }
        if(args[0] == `${PREFIX}playmyplaylist`) {
          con.query("SELECT * FROM youtube_playlist WHERE user_id = ?", [message.author.id], function(err, result) {
            if(result != 0) {
              if(!message.member.voice.channel) return message.reply("Voice channel required to use this command.");
              if(!message.guild.me.voice.channel) return message.reply("I'm not connected to any voice channel!");
              if(message.member.voice.channel != message.guild.me.voice.channel) return message.reply("You are not in my voice channel!");
              if(!GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`]) return message.reply("I'm not playing any song!");

              function getHowManyMusicsHaveBeenAdded() {
                return new Promise((resolve, reject) => {
                  var count = 0; 
                  for(var i = 0; i < result.length; i++) {
                    yts(result[i].url, (err, result) => {
                      if(result.videos[0]) {
                        count++;
                        GuildInfo.MusicPlayer.list[`${message.guild.id}`].push({
                          title: result.videos[0].title,
                          url: result.videos[0].url,
                          seconds: result.videos[0].seconds,
                          thumbnail: result.videos[0].thumbnail,
                          info: {
                              videoId: result.videos[0].videoId,
                              description: result.videos[0].description,
                              seconds: result.videos[0].seconds,
                              timestamp: result.videos[0].timestamp,
                              views: result.videos[0].views
                          }
                      });
                      }
                    });
                  }
                  setTimeout(() => {
                    resolve(count);
                  }, 2000);
                });
              }
              
              (async() => {
                var count = await getHowManyMusicsHaveBeenAdded();
                if(count != 0) {
                  message.channel.send(`✅ added ${count} musics in player queue. Check it with command: **mm!queue**`);
                }
                else message.channel.send("❌ no available url's from your playlist.");
              })();
            }
            else message.channel.send("❌ you don't have any items in your playlist. You can add items with command: **mm!addplaylist**");
          });
        }
        if(args[0] == `${PREFIX}savequeue`) {
          if(!message.member.voice.channel) return message.reply("Voice channel required to use this command.");
          if(!message.guild.me.voice.channel) return message.reply("I'm not connected to any voice channel!");
          if(message.member.voice.channel != message.guild.me.voice.channel) return message.reply("You are not in my voice channel!");
          if(!GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`]) return message.reply("I'm not playing any song!");

          if(args.slice(1).join(" ")) {
            if(GuildInfo.MusicPlayer.list[`${message.guild.id}`]) {
              con.query("SELECT * FROM saved_queue WHERE user_id = ? AND category = ?", [message.author.id, args.slice(1).join(" ")], function(err, result) {
                if(!err) {
                  var queue_array = JSON.stringify(GuildInfo.MusicPlayer.list[`${message.guild.id}`]);

                  if(result == 0) {
                    con.query("INSERT INTO saved_queue (user_id, category, object) VALUES(?, ?, ?)", [message.author.id, args.slice(1).join(" "), queue_array], function(err, result) {
                      if(!err) {
                        message.channel.send(`✅ added ${GuildInfo.MusicPlayer.list[`${message.guild.id}`].length} items in saved queue`);
                      }
                      else message.channel.send("❌ error while inserting values in database");
                    });
                  }
                  else {
                    var list_array = [];
                    var obj = JSON.parse(result[0].object);
                    var added_count = 0;

                    for(var i = 0; i < GuildInfo.MusicPlayer.list[`${message.guild.id}`].length; i++) {
                      if(!checkIfExistsThisUrlInDB(GuildInfo.MusicPlayer.list[`${message.guild.id}`][i].url)) {
                        list_array.push(GuildInfo.MusicPlayer.list[`${message.guild.id}`][i]);
                        added_count++;
                      }
                    }
                    if(added_count != 0) {
                      for(var i = 0; i < list_array.length; i++) {
                        obj.push(list_array[i]);
                      }
                      obj = JSON.stringify(obj);
                      con.query("UPDATE saved_queue SET object = ? WHERE user_id = ? AND category = ?", [obj, message.author.id, args.slice(1).join(" ")]);
                    }
                    message.channel.send(`✅ added +${added_count} in your saved queue list [${args.slice(1).join(" ")}]`);

                    function checkIfExistsThisUrlInDB(url) {
                      if(obj.some(queue => queue.url == url)) return true;
                      else return false;
                    }
                  }
                }
              });
            }
            else message.channel.send("❌ no available queue items");
          }
          else message.channel.send("```Syntax: mm!savequeue [category name]```");
        }
        if(args[0] == `${PREFIX}deletequeue`) {
          if(args.slice(1).join(" ")) {
            con.query("SELECT * FROM saved_queue WHERE user_id = ? AND category = ?", [message.author.id, args.slice(1).join(" ")], function(err, result) {
              if(result != 0) {
                var obj = JSON.parse(result[0].object);
                con.query("DELETE FROM saved_queue WHERE id = ?", [result[0].id], function(err, result) {
                  if(!err) {
                    message.channel.send(`✅ deleted **${obj.length}** musics from category: **${args.slice(1).join(" ")}**`);
                  }
                  else message.channel.send("❌ error while deleting values from database");
                });
              }
              else message.channel.send("❌ you don't have any queues for this category.");
            });
          }
          else message.channel.send("```mm!deletequeue [category name]```");
        }
        if(args[0] == `${PREFIX}savedqueues`) {
          con.query("SELECT * FROM saved_queue WHERE user_id = ?", [message.author.id], function(err, result) {
            if(result != 0) {
              var embed = new Discord.MessageEmbed();
              embed.setColor("RANDOM");
              var string = "";
              for(var i = 0; i < result.length; i++) {
                string += `\n${i+1}. **${result[i].category}** (${JSON.parse(result[i].object).length} musics)`;
              }
              embed.setDescription(string);
              message.channel.send(embed);
            }
            else message.channel.send("❌ you don't have saved queues");
          });
        }
        if(args[0] == `${PREFIX}queueinfo`) {
          if(args.slice(1).join(" ")) {
            con.query("SELECT * FROM saved_queue WHERE user_id = ? AND category = ?", [message.author.id, args.slice(1).join(" ")], function(err, result) {
              if(result != 0) {
                var embed = new Discord.MessageEmbed();
                embed.setColor("RANDOM");
                embed.setTitle(`QUEUE INFO (${result[0].category}):`);
                var obj = JSON.parse(result[0].object), string = "Available musics:";
                for(var i = 0; i < obj.length; i++) {
                  string += `\n**${obj[i].title}**`;
                }
                embed.setDescription(string);
                message.channel.send(embed);
              }
              else message.channel.send("❌ you don't have any queues for this category.");
            });
          }
          else message.channel.send("```Syntax: mm!queueinfo [category name]```");
        }
        if(args[0] == `${PREFIX}loadqueue`) {
          if(args.slice(1).join(" ")) {
            con.query("SELECT * FROM saved_queue WHERE user_id = ? AND category = ?", [message.author.id, args.slice(1).join(" ")], function(err, result) {
              if(result != 0) {
                if(!message.member.voice.channel) return message.reply("Voice channel required to use this command.");
                if(!message.guild.me.voice.channel) return message.reply("I'm not connected to any voice channel!");
                if(message.member.voice.channel != message.guild.me.voice.channel) return message.reply("You are not in my voice channel!");
                if(!GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`]) return message.reply("I'm not playing any song!");

                var obj = JSON.parse(result[0].object);
                for(var i = 0; i < obj.length; i++) {
                  GuildInfo.MusicPlayer.list[`${message.guild.id}`].push(obj[i]);
                }
                message.channel.send(`✅ added ${obj.length} musics in queue from your saved queue. Check command: **mm!queue**`);
              }
              else message.channel.send("❌ you don't have any queues for this category.");
            });
          }
          else message.channel.send("```Syntax: mm!loadqueue [category name]```");
        }
        if(args[0] == `${PREFIX}play`) {
            if(GuildInfo.MusicPlayer.current_music_type[`${message.guild.id}`] == "spotify") return message.reply("I'm already playing a Spotify music. Disconnect me and try again.");
            var embed = new Discord.MessageEmbed();
            embed.setColor("RANDOM");
            embed.setDescription("Searching...");

            if(!message.member.voice.channel) return message.reply("Voice channel required to use this command."); 
            if(!message.member.voice.channel.joinable) return message.reply("Please verify if I can join in your voice channel.");

            var search_string = args.slice(1).join("");
            message.member.voice.channel.join().then(connection => {
                if(search_string) {
                    var player = isNumber(search_string) ? GetPlayerURLBySearchMethods(message.guild, parseInt(search_string)) ? GetPlayerURLBySearchMethods(message.guild, parseInt(search_string)) : search_string : search_string;
                    yts(player, (err, result) => {
                        try {
                            if(!result.videos[0]) return message.reply("No available results for your search.");
                            else {
                                delete embed.description;
                                embed.setTitle(result.videos[0].title);
                                embed.setURL(result.videos[0].url);
                                embed.setThumbnail(result.videos[0].thumbnail);
                                
                                GuildInfo.MusicPlayer.list[`${message.guild.id}`].push({
                                    title: result.videos[0].title,
                                    url: result.videos[0].url,
                                    seconds: result.videos[0].seconds,
                                    thumbnail: result.videos[0].thumbnail,
                                    info: {
                                        videoId: result.videos[0].videoId,
                                        description: result.videos[0].description,
                                        seconds: result.videos[0].seconds,
                                        timestamp: result.videos[0].timestamp,
                                        views: result.videos[0].views
                                    }
                                });

                                if(GuildInfo.MusicPlayer.current[`${message.guild.id}`] == 0) {
                                  embed.setAuthor("Now playing:");
                                  GuildInfo.MusicPlayer.connection[`${message.guild.id}`] = connection;
                                  PlaySound("youtube", message, result.videos[0].url);
                                  GuildInfo.MusicPlayer.channel_check_interval = setInterval(() => {
                                    if(!message.guild.me.voice.channel) ResetVoiceVariables(message.guild);
                                  }, 2000); 
                                }
                                else {
                                  embed.setAuthor(`Added to queue. Position: ${GuildInfo.MusicPlayer.list[`${message.guild.id}`].length+1}`);
                                }

                                message.channel.send(embed);
                            }
                        }
                        catch(e) {
                            message.channel.send("Error from YouTube API")
                            console.log(e.stack);
                        }
                    });
                }
                else message.channel.send("```Syntax: mm!play [Music Name/Link]```");
            });
        }
        if(args[0] == `${PREFIX}skip`) {
            var embed = new Discord.MessageEmbed();
            embed.setColor("RANDOM");

            if(!message.member.voice.channel) return message.reply("Voice channel required to use this command.");
            if(!message.guild.me.voice.channel) return message.reply("I'm not connected to any voice channel!");
            if(message.member.voice.channel != message.guild.me.voice.channel) return message.reply("You are not in my voice channel!");
            if(!GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`]) return message.reply("I'm not playing any song!");
            if(GuildInfo.MusicPlayer.current[`${message.guild.id}`] != GuildInfo.MusicPlayer.list[`${message.guild.id}`].length) {
                PlaySound("youtube", message, GuildInfo.MusicPlayer.list[`${message.guild.id}`][GuildInfo.MusicPlayer.current[`${message.guild.id}`]].url);
                message.channel.send("Skipping...");
            }
            else message.reply("Nothing to skip.");
        }
        if(args[0] == `${PREFIX}disconnect`) {
            var embed = new Discord.MessageEmbed();
            embed.setColor("RANDOM");
            embed.setDescription("Disconnecting...");

            if(!message.member.voice.channel) return message.reply("Voice channel required to use this command.");
            if(!message.guild.me.voice.channel) return message.reply("I'm not connected to any voice channel!");
            if(message.member.voice.channel != message.guild.me.voice.channel) return message.reply("You are not in my voice channel!");
            ResetVoiceVariables(message.guild);
            message.guild.me.voice.channel.leave();
            
            message.channel.send(embed);
        }
        if(args[0] == `${PREFIX}volume`) {
            var embed = new Discord.MessageEmbed();
            embed.setColor("RANDOM");

            var volume_level = args[1];

            if(!message.member.voice.channel) return message.reply("Voice channel required to use this command.");
            if(!message.guild.me.voice.channel) return message.reply("I'm not connected to any voice channel!");
            if(message.member.voice.channel != message.guild.me.voice.channel) return message.reply("You are not in my voice channel!");
            if(!GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`]) return message.reply("I'm not playing any song!");

            if(isNumber(volume_level)) {
                if(volume_level < 0 || volume_level > 100) return message.reply("Min volume level is 0 and max is 100.");
                embed.setDescription(`Setting volume level to **${volume_level}%**`);
                message.channel.send(embed);
                volume_level = volume_level / 50;
                GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`].setVolume(volume_level);
            }
            else message.channel.send("```Syntax: mm!volume [Level]```");
        }
        if(args[0] == `${PREFIX}earrape`) {
          if(IsOwner(message.author.id)) {
            var embed = new Discord.MessageEmbed();
            embed.setColor("RANDOM");
            embed.setDescription("")

            if(!message.member.voice.channel) return message.reply("Voice channel required to use this command.");
            if(!message.guild.me.voice.channel) return message.reply("I'm not connected to any voice channel!");
            if(message.member.voice.channel != message.guild.me.voice.channel) return message.reply("You are not in my voice channel!");
            if(!GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`]) return message.reply("I'm not playing any song!");

            switch(args[1]) {
              case "on": {
                GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`].setVolume(100);
                message.channel.send(embed.setDescription("Enabling earrape..."));
                break;
              }
              case "off": {
                GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`].setVolume(2);
                message.channel.send(embed.setDescription("Disabling earrape..."));
                break;
              }
              default: {
                message.channel.send("```Syntax: mm!earrape [on/off]```");
                break;
              }
            }
          }
          else message.channel.send("ERROR: Missing permissions.");

        }
        if(args[0] == `${PREFIX}bass`) {
            var embed = new Discord.MessageEmbed();
            embed.setColor("RANDOM");

            var bass_level = args[1];

            if(!message.member.voice.channel) return message.reply("Voice channel required to use this command.");
            if(!message.guild.me.voice.channel) return message.reply("I'm not connected to any voice channel!");
            if(message.member.voice.channel != message.guild.me.voice.channel) return message.reply("You are not in my voice channel!");
            if(!GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`]) return message.reply("I'm not playing any song!");

            if(isNumber(bass_level)) {
                if(bass_level < 0 || bass_level > 100) return message.reply("Min bass level is 0 and max is 100.");
                var millis = Date.now() - GuildInfo.MusicPlayer.start_time[`${message.guild.id}`];
                var seek = Math.floor(millis/1000);
                PlaySound("youtube", message, GuildInfo.MusicPlayer.list[`${message.guild.id}`][GuildInfo.MusicPlayer.current[`${message.guild.id}`]-1].url, seek, null, GuildInfo.MusicPlayer.current[`${message.guild.id}`], parseInt(bass_level));
                embed.setDescription(`Setting bass level to: **${bass_level}%**`);
                message.channel.send(embed);
            }
            else message.channel.send("```Syntax: mm!bass [Level]```");
        }
        if(args[0] == `${PREFIX}queue`) {
            if(!GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`]) return message.reply("I'm not playing any songs!");
            var string, count = 0;
            for(var i = 0; i < GuildInfo.MusicPlayer.list[`${message.guild.id}`].length; i++) {
                count++;
                string ? string += `\n${count}. ${GuildInfo.MusicPlayer.list[`${message.guild.id}`][i].title} ${GuildInfo.MusicPlayer.current[`${message.guild.id}`] == count ? '**(Playing)**' : ''}` : string = `${count}. ${GuildInfo.MusicPlayer.list[`${message.guild.id}`][i].title} ${GuildInfo.MusicPlayer.current[`${message.guild.id}`] == count ? '**(Playing)**' : ''}`;
            }
            var embed = new Discord.MessageEmbed();
            embed.setColor("RANDOM");
            embed.setTitle("Queue List:");
            embed.setDescription(string);
            message.channel.send(embed);
        }
        if(args[0] == `${PREFIX}seek`) {
            var embed = new Discord.MessageEmbed();
            embed.setColor("RANDOM");

            var seek_second = args[1];

            if(!message.member.voice.channel) return message.reply("Voice channel required to use this command.");
            if(!message.guild.me.voice.channel) return message.reply("I'm not connected to any voice channel!");
            if(message.member.voice.channel != message.guild.me.voice.channel) return message.reply("You are not in my voice channel!");
            if(!GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`]) return message.reply("I'm not playing any song!");

            if(isNumber(seek_second)) {
                if(GuildInfo.MusicPlayer.list[`${message.guild.id}`][GuildInfo.MusicPlayer.current[`${message.guild.id}`]-1].seconds >= parseInt(seek_second)) {
                    var embed = new Discord.MessageEmbed();
                    embed.setColor("RANDOM");
                    embed.setDescription(`Seeking to seconds: ${seek_second}`);
                    message.channel.send(embed).then(msg => {
                        PlaySound("youtube", message, GuildInfo.MusicPlayer.list[`${message.guild.id}`][GuildInfo.MusicPlayer.current[`${message.guild.id}`]-1].url, parseInt(seek_second), msg);
                    });
                }
                else message.reply("Currently voice connection don't have the input seconds.");
            }
            else message.channel.send("```Syntax: mm!seek [Seconds]```");
        }
        if(args[0] == `${PREFIX}pause`) {
            if(!message.member.voice.channel) return message.reply("Voice channel required to use this command.");
            if(!message.guild.me.voice.channel) return message.reply("I'm not connected to any voice channel!");
            if(message.member.voice.channel != message.guild.me.voice.channel) return message.reply("You are not in my voice channel!");
            if(!GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`]) return message.reply("I'm not playing any song!");
            if(GuildInfo.MusicPlayer.paused[`${message.guild.id}`]) return message.reply("Already paused!");
            GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`].pause();
            GuildInfo.MusicPlayer.paused[`${message.guild.id}`] = true;
            message.reply("Paused.");
        }
        if(args[0] == `${PREFIX}resume`) {
            if(!message.member.voice.channel) return message.reply("Voice channel required to use this command.");
            if(!message.guild.me.voice.channel) return message.reply("I'm not connected to any voice channel!");
            if(message.member.voice.channel != message.guild.me.voice.channel) return message.reply("You are not in my voice channel!");
            if(!GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`]) return message.reply("I'm not playing any song!");
            if(!GuildInfo.MusicPlayer.paused[`${message.guild.id}`]) return message.reply("Already resumed!");
            GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`].resume();
            GuildInfo.MusicPlayer.paused[`${message.guild.id}`] = false;
            message.reply("Resumed.");
        }
        if(args[0] == `${PREFIX}jump`) {
            var jump_list = args[1];
        
            if(!message.member.voice.channel) return message.reply("Voice channel required to use this command.");
            if(!message.guild.me.voice.channel) return message.reply("I'm not connected to any voice channel!");
            if(message.member.voice.channel != message.guild.me.voice.channel) return message.reply("You are not in my voice channel!");
            if(!GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`]) return message.reply("I'm not playing any song!");
        
            if(isNumber(jump_list)) {
                if(GuildInfo.MusicPlayer.list[`${message.guild.id}`][parseInt(jump_list)-1]) {
                    PlaySound("youtube", message, GuildInfo.MusicPlayer.list[`${message.guild.id}`][parseInt(jump_list)-1].url, null, message, parseInt(jump_list));
                }
                else message.reply("This list ID not exists.");
            }
            else message.reply("Input must be in INT (Number)");
        }
        if(args[0] == `${PREFIX}loop`) {
            if(!message.member.voice.channel) return message.reply("Voice channel required to use this command.");
            if(!message.guild.me.voice.channel) return message.reply("I'm not connected to any voice channel!");
            if(message.member.voice.channel != message.guild.me.voice.channel) return message.reply("You are not in my voice channel!");
            
            var embed = new Discord.MessageEmbed();
            embed.setColor("RANDOM");

            switch(args[1]) {
                case "queue": {
                    embed.setDescription(`${GuildInfo.MusicPlayer.loop_current_queue[`${message.guild.id}`] ? "Disabling" : "Enabling"} queue song loop...`);
                    message.channel.send(embed).then(msg => {
                        if(GuildInfo.MusicPlayer.loop_current_song[`${message.guild.id}`]) {
                            embed.setDescription(`Can't ${GuildInfo.MusicPlayer.loop_current_queue[`${message.guild.id}`] ? "disable" : "enable"} queue song loop while current song loop is enabled.`);
                        }
                        else {
                            embed.setDescription(`Queue song loop successfully ${GuildInfo.MusicPlayer.loop_current_queue[`${message.guild.id}`] ? 'disabled' : 'enabled'}.`);
                            GuildInfo.MusicPlayer.loop_current_queue[`${message.guild.id}`] =! GuildInfo.MusicPlayer.loop_current_queue[`${message.guild.id}`];
                        }
                        msg.edit(embed);
                    });
                    break;
                }
                case "current": {
                    embed.setDescription(`${GuildInfo.MusicPlayer.loop_current_song[`${message.guild.id}`] ? "Disabling" : "Enabling"} current song loop...`);
                    message.channel.send(embed).then(msg => {
                        if(GuildInfo.MusicPlayer.loop_current_queue[`${message.guild.id}`]) {
                            embed.setDescription(`Can't ${GuildInfo.MusicPlayer.loop_current_song[`${message.guild.id}`] ? "disable" : "enable"} current song loop while queue song loop is enabled.`);
                        }
                        else {
                            embed.setDescription(`Current song loop successfully ${GuildInfo.MusicPlayer.loop_current_song[`${message.guild.id}`] ? 'disabled' : 'enabled'}.`);
                            GuildInfo.MusicPlayer.loop_current_song[`${message.guild.id}`] =! GuildInfo.MusicPlayer.loop_current_song[`${message.guild.id}`];
                        }
                        msg.edit(embed);
                    });
                    break;
                }
                default: {
                    message.channel.send("```Syntax: mm!loop [queue/current]```");
                    break;
                }
            }
        }
        if(args[0] == `${PREFIX}sinfo`) {
            var queue_list_id = args[1];

            if(!GuildInfo.MusicPlayer.song_connection[`${message.guild.id}`]) return message.reply("I'm not playing any song!");
            if(isNumber(queue_list_id)) {
                if(GuildInfo.MusicPlayer.list[`${message.guild.id}`][parseInt(queue_list_id)-1]) {
                    var sound = GuildInfo.MusicPlayer.list[`${message.guild.id}`][parseInt(queue_list_id)-1];

                    var embed = new Discord.MessageEmbed();
                    embed.setColor("RANDOM");
                    embed.setThumbnail(sound.thumbnail);
                    embed.setTitle(`Song info for: **${sound.title}**`);
                    embed.addField("Title:", sound.title);
                    embed.addField("Description:", sound.info.description);
                    embed.addField("Seconds:", sound.info.seconds);
                    embed.addField("Timestamp:", sound.info.timestamp);
                    embed.addField("Views:", sound.info.views);
                    
                    message.channel.send(embed);
                }
                else message.reply("This list ID not exists.");
            }
            else message.channel.send("```Syntax: mm!sinfo [ID]```");
        }
        if(args[0] == `${PREFIX}search`) {
            var search_string = args.slice(1).join(" ");

            var embed = new Discord.MessageEmbed();
            embed.setColor("RANDOM");
            embed.setDescription("Searching...");

            function generateEmbed(callback) {
                if(search_string) {
                    yts(search_string, (err, result) => {
                        if(!result.videos[0]) return callback(embed.setDescription("No available results for your search."));
                        else {
                            var string, count = 0;
                            GuildInfo.MusicPlayer.search_list[`${message.guild.id}`] = [];
                            for(var i = 0; i < result.videos.length; i++) {
                                if(count != 10) {
                                    count++;
                                    string ? string += `\n**${count}.** - **${result.videos[i].title}**` : string = `**${count}.** - **${result.videos[i].title}**`;
                                    GuildInfo.MusicPlayer.search_list[`${message.guild.id}`].push({
                                        url: result.videos[i].url
                                    });
                                }
                            }
                            return callback(embed.setDescription(string));
                        }
                    });
                }
                else message.reply("title argument required");
            }

            generateEmbed(new_embed => {
                message.channel.send(embed).then(msg => { msg.edit(new_embed); });
            });
        }
        if(args[0] == `${PREFIX}snipe`) {
          var embed = new Discord.MessageEmbed();
          embed.setColor("RANDOM");

          if(ChannelInfo.snipe[`${message.channel.id}`]) {
            var snipe_obj = ChannelInfo.snipe[`${message.channel.id}`];
            if(args[1] != "total" || !args[1]) {
              var last = (snipe_obj.length - 1);
              var exists = true;
              if(snipe_obj[args[1]]) {
                last = (snipe_obj.length - args[1]) - 1;
              }
              else exists = false;
              
              if(exists) {
                embed.setAuthor(`${bot.users.cache.get(snipe_obj[last].by).tag}`, bot.users.cache.get(snipe_obj[last].by).displayAvatarURL({dynamic: true}));
                embed.setDescription(snipe_obj[last].text);
                embed.setFooter(`at: ${TimestampConvert(snipe_obj[last].date)}`);
              }
              else {
                embed.setDescription("Specific snipe count not exists");
              }
            }
            else {
              embed.setDescription(`Total snipes in this channel: **${snipe_obj.length}**`);
            }
          }
          else {
            embed.setDescription("No available snipe");
          }

          message.channel.send(embed);
        }
      }
      catch(err)
      {
        console.log(err.stack)
        let errembed = new Discord.MessageEmbed;
        errembed.setTitle("Oops ! Something went wrong... :cry:")
        errembed.setColor(color=0xFF0000)
        errembed.setDescription("This error is probably caused by something wrong in the bot's script\nor something wrong at your request.\n\nThe error has been automaticly reported to our server !\nTry entering the command again. If the error persists, contact the developer.")
        LogChannelSend("Error reported at: "+GenerateDate()+" in guild "+message.guild.name+" by "+message.author.tag+". Caused by command or function "+message.content)
        LogChannelSend("```"+err.stack+"```")
        return message.channel.send(errembed)
      }
    }
});

bot.on("messageDelete", (message) => {
  if(!ChannelInfo.snipe[`${message.channel.id}`]) ChannelInfo.snipe[`${message.channel.id}`] = [];
  ChannelInfo.snipe[`${message.channel.id}`].push({
    text: message.content,
    by: message.author.id,
    date: Date.now() / 1000
  });
});

//============================
// => Anti Channel Delete
//============================
bot.on("channelDelete", async (channel) => {
    var count = 0;
    await channel.guild.fetchAuditLogs().then(audit => {
      audit.entries.forEach((entries) => {
        if(entries.action == "CHANNEL_DELETE") {
          if(entries.target.id == channel.id) {
            count++;
            if(count == 1) {
              GetUserRowFromThisGuild(channel.guild.id, entries.executor.id, "whitelist", (whitelist) => {
                if(whitelist) return;
                LogChannelSend(`${entries.executor.tag} has deleted channel ${channel.name} from guild ${channel.guild.name}`);
                GetGuildSettings(channel.guild.id, "anti_channeldelete", function(result) {
                  if(result == 1) {
                    let modHighestRole;
                    let botHighestRole;
                    channel.guild.members.cache.get(entries.executor.id).roles.cache.forEach((r) => {
                      modHighestRole = r.position;
                    });
                    channel.guild.members.cache.get(bot.user.id).roles.cache.forEach((r) => {
                      botHighestRole = r.position;
                    });
                    if(modHighestRole <= botHighestRole) {
                      channel.guild.members.cache.get(entries.executor.id).roles.cache.forEach((r) => {
                        channel.guild.members.cache.get(entries.executor.id).roles.remove(r).catch(() => {
                          return;
                        });
                      });
                    }
                  }
                });
              });
            }
          }
        }
      });
    }).catch(() => { return; });
});
//============================
// => Anti Channel Create
//============================
bot.on("channelCreate", async (channel) => {
    var count = 0;
    try {
      await channel.guild.fetchAuditLogs().then(audit => {
        audit.entries.forEach((entries) => {
          if(entries.action == "CHANNEL_CREATE") {
            if(entries.target.id == channel.id) {
              count++;
              if(count == 1) {
                GetUserRowFromThisGuild(channel.guild.id, entries.executor.id, "whitelist", (whitelist) => {
                  if(whitelist) return;
                  LogChannelSend(`${entries.executor.tag} has created channel ${channel.name} in guild ${channel.guild.name}`);
                  GetGuildSettings(channel.guild.id, "anti_channelcreate", function(result) {
                    if(result == 1) {
                      let modHighestRole;
                      let botHighestRole;
                      channel.guild.members.cache.get(entries.executor.id).roles.cache.forEach((r) => {
                        modHighestRole = r.position;
                      });
                      channel.guild.members.cache.get(bot.user.id).roles.cache.forEach((r) => {
                        botHighestRole = r.position;
                      });
                      if(modHighestRole <= botHighestRole) {
                        channel.guild.members.cache.get(entries.executor.id).roles.cache.forEach((r) => {
                          channel.guild.members.cache.get(entries.executor.id).roles.remove(r).catch(() => {
                            return;
                          });
                        });
                      }
                    }
                  });
                });
              }
            }
          }
        });
      }).catch(() => { return; });
    }
    catch { return; }
});
//============================
// => Anti Role Update
//============================
bot.on("roleUpdate", async(role) => {
    var count = 0;
    await role.guild.fetchAuditLogs().then(audit => {
      audit.entries.forEach((entries) => {
        if(entries.action == "ROLE_UPDATE") {
          if(entries.target.id == role.id) {
            count++;
            if(count == 1) {
              GetUserRowFromThisGuild(channel.guild.id, entries.executor.id, "whitelist", (whitelist) => {
                if(whitelist) return;
                LogChannelSend(`${entries.executor.tag} has updated role ${role.name} in guild ${role.guild.name}`);
                GetGuildSettings(role.guild.id, "anti_roleupdate", function(result) {
                  if(result == 1) {
                    let modHighestRole;
                    let botHighestRole;
                    role.guild.members.cache.get(entries.executor.id).roles.cache.forEach((r) => {
                      modHighestRole = r.position;
                    });
                    role.guild.members.cache.get(bot.user.id).roles.cache.forEach((r) => {
                      botHighestRole = r.position;
                    });
                    if(modHighestRole <= botHighestRole) {
                      role.guild.members.cache.get(entries.executor.id).roles.cache.forEach((r) => {
                        role.guild.members.cache.get(entries.executor.id).roles.remove(r).catch(() => {
                          return;
                        });
                      });
                    }
                  }
                });
              });
            }
          }
        }
      });
    }).catch(() => { return; });
});
//============================
// => Anti Role Create
//============================
bot.on("roleCreate", async (role) => {
    var count = 0;
    await role.guild.fetchAuditLogs().then(audit => {
      audit.entries.forEach((entries) => {
        if(entries.action == "ROLE_CREATE") {
          if(entries.target.id == role.id) {
            count++;
            if(count == 1) {
              GetUserRowFromThisGuild(channel.guild.id, entries.executor.id, "whitelist", (whitelist) => {
                if(whitelist) return;
                LogChannelSend(`${entries.executor.tag} has created role ${role.name} in guild ${role.guild.name}`);
                GetGuildSettings(role.guild.id, "anti_roleadd", function(result) {
                  if(result == 1) {
                    let modHighestRole;
                    let botHighestRole;
                    role.guild.members.cache.get(entries.executor.id).roles.cache.forEach((r) => {
                      modHighestRole = r.position;
                    });
                    role.guild.members.cache.get(bot.user.id).roles.cache.forEach((r) => {
                      botHighestRole = r.position;
                    });
                    if(modHighestRole <= botHighestRole) {
                      role.guild.members.cache.get(entries.executor.id).roles.cache.forEach((r) => {
                        role.guild.members.cache.get(entries.executor.id).roles.remove(r).catch(() => {
                          return;
                        });
                      });
                    }
                  }
                });
              });
            }
          }
        }
      });
    }).catch(() => { return; });
});
//============================
// => Anti Role Delete
//============================
bot.on("roleDelete", async (role) => {
    var count = 0;
    await role.guild.fetchAuditLogs().then(audit => {
      audit.entries.forEach((entries) => {
        if(entries.action == "ROLE_DELETE") {
          if(entries.target.id == role.id) {
            count++;
            if(count == 1) {
              GetUserRowFromThisGuild(channel.guild.id, entries.executor.id, "whitelist", (whitelist) => {
                if(whitelist) return;
                LogChannelSend(`${entries.executor.tag} has deleted role ${role.name} from guild ${role.guild.name}`);
                GetGuildSettings(role.guild.id, "anti_roledelete", function(result) {
                  if(result == 1) {
                    let modHighestRole;
                    let botHighestRole;
                    role.guild.members.cache.get(entries.executor.id).roles.cache.forEach((r) => {
                      modHighestRole = r.position;
                    });
                    role.guild.members.cache.get(bot.user.id).roles.cache.forEach((r) => {
                      botHighestRole = r.position;
                    });
                    if(modHighestRole <= botHighestRole) {
                      role.guild.members.cache.get(entries.executor.id).roles.cache.forEach((r) => {
                        role.guild.members.cache.get(entries.executor.id).roles.remove(r).catch(() => {
                          return;
                        });
                      });
                    }
                  }
                });
              });
            }
          }
        }
      });
    }).catch(() => { return; });
});
//============================
// => Anti Kick
//============================
bot.on("guildMemberUpdate", async (member) => {
    var count = 0;
    await member.guild.fetchAuditLogs().then(audit => {
      audit.entries.forEach((entries) => {
        if(entries.action == "MEMBER_KICK") {
          if(entries.target.id ==  member.id) {
            count++;
            if(count == 1) {
              GetUserRowFromThisGuild(channel.guild.id, entries.executor.id, "whitelist", (whitelist) => {
                if(whitelist) return;
                LogChannelSend(`${member.user.tag} has been kicked from guild ${member.guild.name} by: ${entries.executor.tag}`);
                GetGuildSettings(member.guild.id, "anti_kick", function(result){
                  if(result == 1){
                    let modHighestRole;
                    let botHighestRole;
                    member.guild.members.cache.get(entries.executor.id).roles.cache.forEach((r) => {
                      modHighestRole = r.position;
                    });
                    member.guild.members.cache.get(bot.user.id).roles.cache.forEach((r) => {
                      botHighestRole = r.position;
                    });
                    if(modHighestRole <= botHighestRole) {
                      member.guild.members.cache.get(entries.executor.id).roles.cache.forEach((r) => {
                        member.guild.members.cache.get(entries.executor.id).roles.remove(r).catch(() => {
                          return;
                        });
                      });
                    }
                  }
                });
              });
            }
          }
        }
      });
    }).catch(() => { return; });
});
//============================
// => Anti Ban
//============================
bot.on("guildBanAdd", async (guild, user) => {
    var count = 0;
    await guild.fetchAuditLogs().then(audit => {
      audit.entries.forEach((entries) => {
        if(entries.action == "MEMBER_BAN_ADD") {
          if(entries.target.id == user.id){
            count++;
            if(count == 1) {
              GetUserRowFromThisGuild(channel.guild.id, entries.executor.id, "whitelist", (whitelist) => {
                if(whitelist) return;
                LogChannelSend(`${user.tag} has been banned from guild ${guild.name} by: ${entries.executor.tag}`);
                GetGuildSettings(guild.id, "anti_ban", function(result) {
                  if(result == 1) {
                    let modHighestRole;
                    let botHighestRole;
                    guild.members.cache.get(entries.executor.id).roles.cache.forEach((r) => {
                      modHighestRole = r.position;
                    });
                    guild.members.cache.get(bot.user.id).roles.cache.forEach((r) => {
                      botHighestRole = r.position;
                    });
                    if(modHighestRole <= botHighestRole) {
                      guild.members.cache.get(entries.executor.id).roles.cache.forEach((r) => {
                        guild.members.cache.get(entries.executor.id).roles.remove(r).catch(() => {
                          return;
                        });
                      });
                    }
                  }
                });
              });
            }
          }
        }
      });
    }).catch(() => { return; });
  });
bot.on('inviteCreate', async invite => guildInvites.set(invite.guild.id, await invite.guild.fetchInvites()));
bot.on('guildMemberAdd', async member => {
      if(member.user.bot) return;

      CreateUserIfNotExist(member.user.id);
      CreateUserIfNotExistInSpecificGuild(member.user.id, member.guild.id);
  
      GetGuildSettings(member.guild.id, "auto_role", function (auto_role_id) {
        if(auto_role_id != "0") {
          var role = member.guild.roles.cache.get(auto_role_id);
          if(role){
            member.roles.add(role);
          }
        }
      });
      GetGuildSettings(member.guild.id, "total_members_joined", function(total_members_joined) {
        con.query("UPDATE guilds_settings SET total_members_joined = ? WHERE guild_id = ?", [total_members_joined+1, member.guild.id]);
      });
  
      // -> Invite track
      GetGuildSettings(member.guild.id, "welcome_channel", function(result) {
        if(result != "0") { 
          member.guild.fetchInvites().then(guildInvites => {
            const ei = invites[member.guild.id];
            invites[member.guild.id] = guildInvites;
            const invite = guildInvites.find(i => ei.get(i.code).uses < i.uses);
            const inviter = bot.users.cache.get(invite.inviter.id); 
            con.query("SELECT * FROM users_data WHERE guild_id = ? AND user_id = ?", [member.guild.id, inviter.id], function(err2, result2){
              try {
                if(result != 0) {
                  con.query("DELETE FROM users_data WHERE guild_id = ? AND user_id = ?", [member.guild.id, member.user.id]);
                }
                else 
                {
                    con.query("INSERT INTO users_data (guild_id, user_id, invited_by) VALUES(?, ?, ?)", [member.guild.id, member.user.id, inviter.id]);
                }
                var embed = new Discord.MessageEmbed();
                embed.setColor("00FF00");
                embed.setDescription(`👋 **${member.user.tag}** just joined in the server!`);
                embed.addField("Invited by:", `${inviter.tag} (${result2 != 0 ? ((result2[0].success_invites)+1) + " invites" : '1 invite'})`, true);
                embed.addField("Member:", `#${member.guild.members.cache.size}`, true);
                member.guild.channels.cache.get(result).send(embed);
                con.query("SELECT * FROM users_data WHERE guild_id = ? AND user_id = ?", [member.guild.id, member.user.id], function(err, result){
  
                  //-> Update inviter data
                  if(result2 != 0){
                    var success_invites = (result2[0].success_invites)+1;
                    con.query("UPDATE users_data SET success_invites = ? WHERE guild_id = ? AND user_id = ?", [success_invites, member.guild.id, inviter.id]);
                  }
                  else {
                    con.query("INSERT INTO users_data (guild_id, user_id, total_invites, success_invites) VALUES(?, ?, ?, ?)", [member.guild.id, inviter.id, 1, 1]);
                  }
                });
              }
              catch{}
            });
          });
        }
      });
  
      if(member.user.bot) return;
      const cachedInvites = guildInvites.get(member.guild.id);
      const newInvites = await member.guild.fetchInvites();
      guildInvites.set(member.guild.id, newInvites);
      try {
          const usedInvite = newInvites.find(inv => cachedInvites.get(inv.code).uses < inv.uses);
          const embed = new Discord.MessageEmbed;
          con.query(`SELECT * FROM invite_links WHERE invite_link = '${usedInvite.code}'`, function(err, rows) {
            if(!rows[0])
            {
              con.query(`INSERT INTO invite_links(invite_link, joined, leaved) VALUES ('${usedInvite.code}', '1', '0')`)
              embed.setDescription(`Welcome ${member.user} !\n\nInvited by ${usedInvite.inviter.tag}\n\nInvited in total: 1`)
              embed.setColor('00FF00')
              
            }
            else
            {
              var joined_total = rows[0].joined + 1
              con.query(`UPDATE invite_links SET joined='${joined_total}' WHERE invite_link = '${usedInvite.code}'`)
              embed.setDescription(`Welcome ${member.user} !\n\nInvited by ${usedInvite.inviter.tag}\n\nInvited in total: ${joined_total}`)
              embed.setColor('00FF00')
            }
        })
      }
      catch(err) {
          console.log(err);
      }
})
bot.on("guildMemberRemove", (member) => {
    if(member.user.bot) return;
  
    GetGuildSettings(member.guild.id, "total_members_left", function(total_members_left) {
      con.query("UPDATE guilds_settings SET total_members_left = ? WHERE guild_id = ?", [total_members_left+1, member.guild.id]);
    });
  
    con.query("SELECT * FROM users_data WHERE guild_id = ? AND user_id = ?", [member.guild.id, member.user.id], function(err, result){
      if(result != 0) {
        var inviter = result[0].invited_by;
        GetGuildSettings(member.guild.id, "welcome_channel", function(result) {
          if(result != "0") { 
            var inviter_data=bot.users.cache.get(inviter);
            var embed = new Discord.MessageEmbed();
            embed.setColor("FF0000");
            embed.setDescription(`👋 **${member.user.tag}** has left the server!`);
            embed.addField("Invited by:", `${inviter_data?inviter_data.tag:'Unknown'}`);
            var send_channel = member.guild.channels.cache.get(result);
            if(send_channel) {
              send_channel.send(embed);
            }
          }
        });
        con.query("DELETE FROM users_data WHERE guild_id = ? AND user_id = ?", [member.guild.id, member.user.id]);
        con.query("SELECT * FROM users_data WHERE guild_id = ? AND user_id = ?", [member.guild.id, inviter], function(err, result){
          if(result != 0){
            var new_success_invites = (result[0].success_invites)-1;
            con.query("UPDATE users_data SET success_invites = ? WHERE user_id = ?", [new_success_invites, inviter]);
          }
        });
      }
    });
});

bot.on("guildCreate", (guild) => {
    try {
      CreateGuildSettingsIfDontHave(guild.id);
      LoadGuildVariables(guild.id)
    }
    catch(e) {
      console.log(e.stack);
    }
});

bot.on('guildDelete', (guild) =>
{
    DeleteGuildVariables(guild.id);
});

bot.on("messageReactionAdd", (reaction, user) => {
    console.log(`user: ${user.tag} reacted in: ${reaction.message.guild.name} with emoji: ${reaction.emoji}`);
});

bot.on("channelDelete", (channel) => {
    if(channel.type == "category"){
      GetGuildSettings(channel.guild.id, "role_counter", function(result){
        if(result != "0") {
          con.query("SELECT * FROM role_counter WHERE guild_id = ?", [channel.guild.id], function(err, result) {
            if(result != 0) {
              for(var i = 0; i < result.length; i++) {
                var role = channel.guild.roles.cache.get(result[i].role_id);
                if(role){
                  bot.guilds.cache.get(channel.guild.id).channels.cache.filter(c => !c.parent).forEach((c) => {
                    var c_name = `${c.name}`.toLowerCase();
                    var r_name = `${role.name}`.toLowerCase();
                    if(`${c_name}`.includes(`${r_name}`)){
                      c.delete();
                      con.query("DELETE FROM role_counter WHERE guild_id = ? AND role_id = ?", [channel.guild.id, role.id]);
                    }
                  });
                }
              }
            }
          });
          UpdateGuildSettings(channel.guild.id, "role_counter", "0");
        }
      });
    }
    if(channel.type == "voice") {
      con.query("SELECT * FROM role_counter WHERE guild_id = ?", [channel.guild.id], function(err, result) {
        if(result != 0) {
          for(var i = 0; i < result.length; i++) {
            var role = channel.guild.roles.cache.get(result[i].role_id);
            if(role){
              var c_name = `${channel.name}`.toLowerCase();
              var r_name = `${role.name}`.toLowerCase();
              if(`${c_name}`.includes(`${r_name}`)){
                con.query("DELETE FROM role_counter WHERE guild_id = ? AND role_id = ?", [channel.guild.id, role.id]);
                if(result.length == 1) {
                  GetGuildSettings(channel.guild.id, "role_counter", function(counter_result) {
                    if(counter_result != "0") {
                      var category = channel.guild.channels.cache.get(counter_result);
                      if(category){
                        category.delete();
                        UpdateGuildSettings(channel.guild.id, "role_counter", "0");
                      }
                    }
                  });
                }
              }
            }
          }
        }
      });
    }
});

var interval = setInterval(function(){ 
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  UsageChannelSend(`Bot-ul Mighty folosește în acest moment din cei 8 GB de RAM: ${Math.round(used * 100) / 100} MB`);
}, 10000);

/*bot.on("voiceStateUpdate", (oldMember, newMember) => {
    if(oldMember.channelID == null || typeof oldMember.channelID == undefined) return;
    if(newMember.id != bot.user.id) return;
    ResetVoiceVariables(oldMember.guild);
});*/
