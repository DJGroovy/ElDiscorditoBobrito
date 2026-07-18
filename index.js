require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");

const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
const UNIVERSE_ID = process.env.ROBLOX_UNIVERSE_ID;
const BRIDGE_TOPIC = "DiscordBridge";

async function publishToJob(jobId, payload) {
  const url = `https://apis.roblox.com/messaging-service/v1/universes/${UNIVERSE_ID}/topics/${BRIDGE_TOPIC}`;
  const body = { message: JSON.stringify({ JobId: jobId, ...payload }) };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": ROBLOX_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Open Cloud publish failed: ${response.status}`);
  }
}

function toAssetIdString(value) {
  const trimmed = String(value).trim();
  if (trimmed.startsWith("rbxassetid://")) return trimmed;
  return `rbxassetid://${trimmed.replace(/\D/g, "")}`;
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const jobId = interaction.options.getString("jobid");
  await interaction.deferReply({ ephemeral: true });

  try {
    if (interaction.commandName === "message") {
      const name = interaction.options.getString("name");
      const message = interaction.options.getString("message");
      await publishToJob(jobId, { Action: "Message", Name: name, Text: message });
      await interaction.editReply(`Sent message as **${name}** to \`${jobId}\`.`);
    } else if (interaction.commandName === "jumpscare") {
      const image = toAssetIdString(interaction.options.getString("image"));
      const sound = toAssetIdString(interaction.options.getString("sound"));
      await publishToJob(jobId, { Action: "Jumpscare", ImageId: image, SoundId: sound });
      await interaction.editReply(`Triggered jumpscare on \`${jobId}\`.`);
    }
  } catch (error) {
    console.error(error);
    await interaction.editReply("Something went wrong publishing to that server.");
  }
});

client.login(process.env.DISCORD_TOKEN);
