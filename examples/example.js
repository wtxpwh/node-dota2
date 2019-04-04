const steam = require("steam"),
    util = require("util"),
    fs = require("fs"),
    crypto = require("crypto"),
    Dota2 = require("../"),
    steamClient = new steam.SteamClient(),
    steamUser = new steam.SteamUser(steamClient),
    steamFriends = new steam.SteamFriends(steamClient),
    dota2Client = new Dota2.Dota2Client(steamClient, true),
    Long = require("long");

// Load config
global.config = require("./config");


// Load in server list if we've saved one before
try {
    if (fs.existsSync('servers')) {
        steam.servers = JSON.parse(fs.readFileSync('servers'));
    }
} catch (e) {
    console.log("Cannae load the sentry. " + e);
}


/* Steam logic */
const onSteamLogOn = function onSteamLogOn(logonResp) {
        if (logonResp.eresult === steam.EResult.OK) {
            steamFriends.setPersonaState(steam.EPersonaState.Busy); // to display your steamClient's status as "Online"
            steamFriends.setPersonaName(global.config.steam_name); // to change its nickname
            console.log("Logged on.");
            dota2Client.launch();


            dota2Client.on("ready", function () {
                console.log("Node-dota2 ready.");


                dota2Client.leavePracticeLobby(function (err, body) {
                    console.log(JSON.stringify(body));
                });
                dota2Client.destroyLobby(function (err, body) {
                    console.log(JSON.stringify(body));
                });
                /* LOBBIES */
                dota2Client.createPracticeLobby({
                        "game_name": "dota2-bot-test",
                        "server_region": Dota2.ServerRegion.PWTELECOMWUHAN,
                        "game_mode": Dota2.schema.DOTA_GameMode.DOTA_GAMEMODE_CUSTOM,
                        "series_type": 0,
                        "game_version": 1,
                        "allow_cheats": false,
                        "fill_with_bots": false,
                        "allow_spectating": true,
                        "pass_key": "xxzz1",
                        "radiant_series_wins": 0,
                        "dire_series_wins": 0,
                        "allchat": false,
                        "custom_game_mode": "1613886175",
                        "custom_map_name": "normal",
                        "custom_difficulty": 0,
                        "custom_game_id": new Long.fromString("1613886175"),
                        "custom_min_players": 1,
                        "custom_max_players": 8,
                        "custom_game_crc": new Long.fromString("13580460572162792542"),
                        "custom_game_timestamp": Date.now(),
                        "custom_game_penalties": false,
                        "pause_setting": 1
                    },
                    function (err, body) {
                        console.log(JSON.stringify(body));
                        //dota2Client.inviteToLobby(new Long.fromString("76561198030533450"));
                        dota2Client.inviteToLobby(new Long.fromString("76561198098695707"));
                    });
            });

            dota2Client.on("practiceLobbyUpdate", function (lobby) {
                console.log("lobby practiceLobbyUpdate.");

            });


            dota2Client.on("unready", function onUnready() {
                console.log("Node-dota2 unready.");
            });
            dota2Client.on("chatMessage", function (channel, personaName, message) {
                // util.log([channel, personaName, message].join(", "));
            });
            dota2Client.on("guildInvite", function (guildId, guildName, inviter) {
                // dota2Client.setGuildAccountRole(guildId, 75028261, 3);
            });
            dota2Client.on("unhandled", function (kMsg) {
                console.log("UNHANDLED MESSAGE " + Dota2._getMessageName(kMsg));
            });
/*
            setTimeout(function () {
                dota2Client.leavePracticeLobby(function (err, body) {
                    console.log(JSON.stringify(body));
                });
                dota2Client.destroyLobby(function (err, body) {
                    console.log(JSON.stringify(body));
                });
                dota2Client.exit();
            }, 60000);*/

        }
    },
    onSteamServers = function onSteamServers(servers) {
        console.log("Received servers.");
        fs.writeFile('servers', JSON.stringify(servers), (err) => {
            if (err) {
                if (this.debug) console.log("Error writing ");
            } else {
                if (this.debug) console.log("");
            }
        });
    },
    onSteamLogOff = function onSteamLogOff(eresult) {
        console.log("Logged off from Steam.");
    },
    onSteamError = function onSteamError(error) {
        console.log("Connection closed by server: " + error);
    };

steamUser.on('updateMachineAuth', function (sentry, callback) {
    var hashedSentry = crypto.createHash('sha1').update(sentry.bytes).digest();
    fs.writeFileSync('sentry', hashedSentry)
    console.log("sentryfile saved");
    callback({
        sha_file: hashedSentry
    });
});


// Login, only passing authCode if it exists
const logOnDetails = {
    "account_name": global.config.steam_user,
    "password": global.config.steam_pass,
};
if (global.config.steam_guard_code) logOnDetails.auth_code = global.config.steam_guard_code;
if (global.config.two_factor_code) logOnDetails.two_factor_code = global.config.two_factor_code;

try {
    var sentry = fs.readFileSync('sentry');
    if (sentry.length) logOnDetails.sha_sentryfile = sentry;
} catch (beef) {
    console.log("Cannae load the sentry. " + beef);
}

steamClient.connect();
steamClient.on('connected', function () {
    steamUser.logOn(logOnDetails);
});
steamClient.on('logOnResponse', onSteamLogOn);
steamClient.on('loggedOff', onSteamLogOff);
steamClient.on('error', onSteamError);
steamClient.on('servers', onSteamServers);
