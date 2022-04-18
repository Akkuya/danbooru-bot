import { Client, Intents, MessageEmbed } from "discord.js";
import dotenv from 'dotenv'
import fetch from 'node-fetch'

dotenv.config()

const myIntents = new Intents()
myIntents.add(
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES
)

const client = new Client({ intents: myIntents })

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`)
})

let delay = 5000
client.on('messageCreate', async(message) => {
    if (!message.content.startsWith('d?')) { return }
    const commandBody = message.content.slice(2)
    const args = commandBody.split(" ")
    const cmd = args.shift().toLowerCase()

    switch (cmd) {
        case 'setdelay':
            clearInterval(interval)
            delay = args[0]
            setInterval(main, delay)
            message.reply(`Delay set to ${delay} milliseconds!`)
            break;
        case 'addtags':
            let string = ''

            for (let i = 0; i < args.length; i++) {
                categories.push({
                    "name": args[i],
                    "last_id": 1
                })
                string += args[i] + ", "
            }

            message.reply(`Added ${string} to the list of watched tags!`)
            break;
        case 'list':
            let tags = ''
            for (let i = 0; i < categories.length; i++) {
                tags += categories[i].name + " "
            }
            message.reply(`Watching these categories: \`${tags}\` `)
            break;
        case 'removetags':
            let removed = false;
            for (let i = 0; i < categories.length; i++) {
                if (categories[i].name == args[0]) {
                    categories.splice(categories[i], 1)
                    removed = true
                }
            }
            if (removed) {
                message.reply(`Removed ${args[0]} from the list of watched tags!`)
            } else {
                message.reply("That tag wasn't found in the list of watched tags.")
            }
            break;
        default:
            break;
    }
    if (cmd == 'help') {
        const helpEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Help Page')
            .setDescription('Command Usage. Prefix is d?.')
            .addFields({
                name: 'd?setdelay *<duration>*',
                value: 'Sets how often the bot will check for new posts. Duration must be in milliseconds.\nExample: `d?setdelay 10000`'
            }, {
                name: 'd?addtags *<tag>*',
                value: 'Adds tags to the list of tags the bot checks. Tags must be separated by spaces, and multi-word tags must be separated by an underscore.\n Example `d?addtags blue_hair glasses`'
            }, {
                name: 'd?list',
                value: 'Lists the tags the bot is currently watching'
            }, {
                name: 'd?removetag *<tag>*',
                value: 'Removes a tag from the list of watched tags. Unlike addtags, this only works with one at a time. \nExample: `d?removetag blue_hair`'
            })


        message.reply({ embeds: [helpEmbed] });
    }

});
let categories = [{
        "name": "syringe",
        "last_id": 120893
    },
    {
        "name": "skirt",
        "last_id": 120398
    }
]
const main = async() => {
    for (let i = 0; i < categories.length; i++) {
        let myRequest = await fetch(`https://danbooru.donmai.us/post_versions.json?search[added_tags_include_all]=${categories[i].name}&limit=2`).catch(() => {
            console.error;
            return
        })
        myRequest = await myRequest.json()
        console.log(myRequest[0].post_id)
        if (categories[i].id != myRequest[0].post_id) {
            client.channels.fetch('868311048439103531')
                .then(channel => channel.send(`New post under ${categories[i].name}: https://danbooru.donmai.us/posts/${myRequest[0].post_id} `))
            categories[i].id = myRequest[0].post_id
        } else {
            console.log(`No new posts under \`${categories[i].name}\``)
        }

    }
}
let interval = setInterval(main, delay)

client.login(process.env.TOKEN)