import { Client, Intents, MessageEmbed } from "discord.js";
import dotenv from 'dotenv'
import fetch from 'node-fetch'
import fs from 'fs'


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

let delay = 30000
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
                const addition = {
                    "name": args[i].toLowerCase(),
                    "id": 1
                }

                fs.readFile("./tags.json", "utf8", function readFileCallback(err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                        var obj = JSON.parse(data); //now converting it to an object
                        obj.categories.push(addition); //adding the data
                        var json = JSON.stringify(obj, null, 2); //converting it back to json
                        fs.writeFile("./tags.json", json, "utf8", (err) => {
                            if (err) {
                                console.log(err);
                            } else {

                            }
                        });
                    }
                });

                string += args[i].toLowerCase() + ", "
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
        case 'removetag':
            let removed = false;

            for (let i = 0; i < categories.length; i++) {
                if (categories[i].name == args[0]) {
                    fs.readFile("./tags.json", "utf8", function readFileCallback(err, data) {
                        if (err) {
                            console.log(err);
                        } else {
                            var obj = JSON.parse(data); //now converting it to an object
                            obj.categories.splice(i, 1) //adding the data
                            var json = JSON.stringify(obj, null, 2); //converting it back to json
                            fs.writeFile("./tags.json", json, "utf8", (err) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("Done");
                                }
                            });
                        }
                    });
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

const main = async() => {
    let rawdata = fs.readFileSync('tags.json');
    let categories = JSON.parse(rawdata).categories;
    for (let i = 0; i < categories.length; i++) {
        let myRequest = await fetch(`https://danbooru.donmai.us/post_versions.json?search[added_tags_include_all]=${categories[i].name}&limit=2`).catch(() => {
            console.error;
            return
        })
        myRequest = await myRequest.json()
        try {
            console.log(myRequest[0].post_id)
        } catch (error) {
            console.log(`No posts found under ${categories[i].name}`)
            continue
        }
        console.log(`Checking ${categories[i].name}...`)
        if (categories[i].id != myRequest[0].post_id) {
            client.channels.fetch('965731160867094568')
                .then(channel => channel.send(`New post under ${categories[i].name}: https://danbooru.donmai.us/posts/${myRequest[0].post_id} `))
            fs.readFile("./tags.json", "utf8", function readFileCallback(err, data) {
                if (err) {
                    console.log(err);
                } else {
                    var obj = JSON.parse(data); //now converting it to an object
                    obj.categories[i].id = myRequest[0].post_id //adding the data
                    var json = JSON.stringify(obj, null, 2); //converting it back to json
                    fs.writeFile("./tags.json", json, "utf8", (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("Done");
                        }
                    });
                }
            });
        } else {
            console.log(`No new posts under \`${categories[i].name}\``)
        }

    }
}
let interval = setInterval(main, delay)

client.login(process.env.TOKEN)