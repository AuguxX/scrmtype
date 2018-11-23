const { message, Client, RichEmbed } = require('discord.js');


let guilds = {}
let scrims = {}

// access: 0 = everyone; access: 1 = moderators; access: 2 = administrators;
exports.commands = {
	// everyone
	help:{access:0,desc:"Comandos Disponibles"},
	host:{access:2,desc:"Comenzar scrim"},
	setup:{access:3,desc:"Configuracion [BETA]"},
};

exports.newGuild = function(guild){
	if (guilds[guild.id] != undefined) return
	guilds[guild.id] = {
		setup:false,
		prefix:"!",
		modrole:"",
		mutedrole:"",
		scrimrole:"",
		hostrole:"Administrator",
		digitchan:"scrim-chat",
		countdownchan:"General",
	}
	//if (guild.systemChannel != null) guild.systemChannel.send("Settings need to be set up, for bot to be fully functional. Type !setup for further instructions!")
}

exports.delGuild = function(guild){
	delete guilds[guild.id]
}

exports.setData = function(guild,prefix,modrole,mutedrole,scrimrole,hostrole,digitchan,countdownchan){
	let data;
	if (typeof prefix === "object") {
		data = prefix;
	}
	if (data != undefined) {
		Object.keys(data).forEach(function(key){
			if (guilds[guild.id][key] != undefined) guilds[guild.id][key] = data[key];
		})
	} else {
		if (prefix != undefined) guilds[guild.id].prefix = prefix;
		if (modrole != undefined) guilds[guild.id].modrole = modrole;
		if (mutedrole != undefined) guilds[guild.id].mutedrole = mutedrole;
		if (scrimrole != undefined) guilds[guild.id].scrimrole = scrimrole;
		if (hostrole != undefined) guilds[guild.id].hostrole = hostrole;
		if (digitchan != undefined) guilds[guild.id].digitchan = digitchan;
		if (countdownchan != undefined) guilds[guild.id].countdownchan = countdownchan;
	}
	if (guilds[guild.id].hostrole != "" && guilds[guild.id].digitchan != "" && guilds[guild.id].countdownchan != "") {
		guilds[guild.id].setup = true;
	} else {
		guilds[guild.id].setup = false;
	}
}

exports.getData = function(guild){
	return guilds[guild.id]
}

exports.one = function(val) {
	if (val == 0) return "**Ahora!**"; else return val+" **minutos**";
}

exports.startScrim = function(guild,host,type,time){
	const embed = new RichEmbed()
		.setColor(0x91bbff)
		.addField("Scrim Match Starting","Scrim match is starting in "+exports.one(time),false)
		.addField("Mode",type.toUpperCase(),true)
		.addField("Host",host,true)
		.addField("Instructions","Countdown will be made in countdown channel, where you'll need to ready up on go. First be sure to have content loaded in game, after that wait for further instructions.",false)

		let channel = guild.channels.find(channel => channel.name === guilds[guild.id].digitchan);
		let channel2 = guild.channels.find(channel => channel.name === guilds[guild.id].countdownchan);
	if (channel && channel2) {
		channel.send(embed)
		scrims[guild.id] = {
			timer:setTimeout(function(){
				channel2.join().then(connection => { // Connection is an instance of VoiceConnection
						const dispatcher = connection.playFile('./Audio/test.mp3');
						 console.log('dispatcher'); console.log(dispatcher == null);
						dispatcher.on('end', () => {
							channel2.leave();
							const embed2 = new RichEmbed()
								.setColor(0xc1d9ff)
								.addField("Introduce los ultimos 3 digitos de lobby","Puedes encontrarlos en la esquina superior izquierda de la pantalla!",false)
							channel.send(embed2)
							scrims[guild.id].codes = true;
							scrims[guild.id].codedata = {}
							scrims[guild.id].playerinterval = setInterval(function(){
								const embed4 = new RichEmbed()
									.setColor(0xc1d9ff)
									.setTitle("mensaje 1")
								Object.keys(scrims[guild.id].codedata).forEach(function(key){
									let codeobj = scrims[guild.id].codedata[key];
									let user_str = "";
									Object.keys(scrims[guild.id].codedata[key]).every(function(key2,count){
										let user = scrims[guild.id].codedata[key][key2];
										user_str = user_str+user+"\n"
										if (count >= 15) {
											if (count > 15) user_str = user_str+"que es esto";
											return false;
										};
									})
									embed4.addField(key+" ("+Object.keys(codeobj).length+" jugadore msg1)",user_str,true)
								})
								channel.send(embed4)
								// .then(m => m.edit('boop'));
							},5000)
							scrims[guild.id].timer2 = setTimeout(function(){
								scrims[guild.id].codes = false;
								clearInterval(scrims[guild.id].playerinterval)
								const embed3 = new RichEmbed()
									.setColor(0xc1d9ff)
									.setTitle("mensaje2")
								Object.keys(scrims[guild.id].codedata).forEach(function(key){
									let codeobj = scrims[guild.id].codedata[key];
									let user_str = "";
									Object.keys(scrims[guild.id].codedata[key]).every(function(key2,count){
										let user = scrims[guild.id].codedata[key][key2];
										user_str = user_str+user+"\n"
										if (count >= 15) {
											if (count > 15) user_str = user_str+"y mas..";
											return false;
										};
									})
									embed3.addField(key+" ("+Object.keys(codeobj).length+" players msg2)",user_str,true)
								})
								channel.send(embed3)
							}, 1*60000);
						});
					})
			}, time*60000),
		};
	};
}

exports.stopScrim = function(guild){
	if (scrims[guild.id].timer) clearTimeout(scrims[guild.id].timer)
	if (scrims[guild.id].timer2) clearTimeout(scrims[guild.id].timer2)
	clearInterval(scrims[guild.id].playerinterval)
	delete scrims[guild.id]
}

function check(guild,user) {
	let checked = false;
	Object.keys(scrims[guild.id].codedata).forEach(function(key){
		Object.keys(scrims[guild.id].codedata[key]).forEach(function(key2,count){
			let userr = scrims[guild.id].codedata[key][key2];
			if (user.id == userr.id) checked = true;
		})
	})
	return checked;
}

exports.setScrimData = function(guild,user,code){
	if (check(guild,user) || code.length > 3 || code.length < 3) return
	if (!scrims[guild.id].codedata[code]) scrims[guild.id].codedata[code] = {};
	scrims[guild.id].codedata[code][user.id] = user
}

exports.getScrimData = function(guild){
	return scrims[guild.id]
}
