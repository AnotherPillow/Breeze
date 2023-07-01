var msgs = [
	"Hello!",
	"Nice weather!",
	"How are you?",
	"What is your opinion on pizza?",
	"Do you enjoy cycling?",
	"What is your professional opinion on the state of technological advancement worldwide, and how do you forecast it will increase over the next several years?",
	"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaAAAAAAAAAAAAAAAAAAAAA"
]
let inp = document.querySelector("#message_input")
setInterval(()=>{
	let msg = msgs[Math.floor(Math.random()*msgs.length)];
	inp.value = msg
	
	sendMessage(inp.value)
	inp.value = ''
}, 13000)