const request = require('request');
const { ApplicationCommandOptionType } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

const PARAM_TYPE = ApplicationCommandOptionType.String;
const description = 'get the club7000 profile data.'
const options = [
    {
        name: 'vanityurl',
        description: 'Get profile from vanityurl',
        required: false,
        type: PARAM_TYPE,
    },
	{
        name: 'steamid', // Name of the param
        description: 'Get profile from steamid', // Description of the param
        required: false, // Check if the param is obligatory
        type: PARAM_TYPE, // The type of param
    },
]
const apiKeys = [
    '5DA40A4A4699DEE30C1C9A7BCE84C914',
    '5970533AA2A0651E9105E706D0F8EDDC',
    '2B3382EBA9E8C1B58054BD5C5EE1C36A'
];

const fetchSteamID = async (apikey, vanityurl) => {
    return new Promise((resolve, reject) => {
        const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${apikey}&vanityurl=${vanityurl}`;
        
        request(url, (err, res, body) => {
            if (err) {
                reject(err);
                return;
            }

            const steamIDResponse = JSON.parse(body);
            resolve(steamIDResponse.response);
        });
    });
};

const fetchUserGameData = async (steamID) => {
    return new Promise((resolve, reject) => {
        request("https://raw.githubusercontent.com/MalikRemgcRegion/MalikRemgcRegion.github.io/main/db_club7000/db/db.json", (err, res, body) => {
            if (err) {
                reject(err);
                return;
            }

            const j_db = JSON.parse(body);
            const userData = j_db.find(user => user.id === steamID);

            if (userData) {
                const gameCountArray = userData.game_count || [];
                const regionArray = userData.region || [];
                resolve({ gameCountArray, regionArray });
            } else {
                resolve(null);
            }
        });
    });
};

const fetchAdditionalData = async (steamID) => {
    return new Promise((resolve, reject) => {
        request(`https://raw.githubusercontent.com/MalikRemgcRegion/MalikRemgcRegion.github.io/main/db_club7000/ids/${steamID}.json`, (err, res, body) => {
            if (err) {
                reject(err);
                return;
            }

            const j_id = JSON.parse(body);
            resolve(j_id);
        });
    });
};

const buildChartConfig = (region, game_count) => {
    const ChartjsCFG = {
        type: 'line',
        data: {
            labels: region,
            datasets: [{
                label: 'App Count',
                data: game_count,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1,
            }],
        },
    };

    return ChartjsCFG;
};

const constructEmbed = (vanityurl, j_id, ChartjsCFG, steam64ID) => {
    const profile_embed = new EmbedBuilder()
        .setTitle(vanityurl)
        .setURL(`https://malikremgcregion.github.io/?id=${steam64ID}`)
        .setDescription("apps owned: " + JSON.stringify(j_id.length))
        .setImage(`https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(ChartjsCFG))}`);

    return profile_embed;
};

const init = async (interaction, client) => {
    try {
		const apikey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
        const vanityurl = interaction.options.getString('vanityurl');
		const steamid = interaction.options.getString('steamid');

		if (vanityurl) {
			const steamIDResponse = await fetchSteamID(apikey, vanityurl);

			if (steamIDResponse.success === 1) {
				const userData = await fetchUserGameData(steamIDResponse.steamid);
				
				if (userData) {
					const { gameCountArray, regionArray } = userData;
					const ChartjsCFG = buildChartConfig(regionArray, gameCountArray);
					const j_id = await fetchAdditionalData(steamIDResponse.steamid);
					const embed = constructEmbed(vanityurl, j_id, ChartjsCFG, steamIDResponse.steamid);
					
					interaction.reply({ embeds: [embed] });
				} else {
					interaction.reply("User data not found.");
				}
			} else {
				interaction.reply("Vanity URL not found or an error occurred.");
			}
		} else if (steamid) {
			const isValidSteamID = (steamid) => typeof steamid === 'string' && steamid.length === 17 && /^\d+$/.test(steamid);

			if (isValidSteamID(steamid)) {
				const userData = await fetchUserGameData(steamid);
				
				if (userData) {
					const { gameCountArray, regionArray } = userData;
					const ChartjsCFG = buildChartConfig(regionArray, gameCountArray);
					const j_id = await fetchAdditionalData(steamid);
					const embed = constructEmbed(steamid, j_id, ChartjsCFG, steamid);
					
					interaction.reply({ embeds: [embed] });
				} else {
					interaction.reply("User data not found.");
				}
			} else {
				interaction.reply("Steam ID not found or an error occurred.");
			}
		} else {
			interaction.reply("Please provide either 'vanityurl' or 'steamid'.");
		}
    } catch (error) {
        console.error(error);
        interaction.reply("An error occurred while processing the command.");
    }
};

module.exports = { init, description, options };
