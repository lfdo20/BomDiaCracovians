var token = '501638485:AAG_WSsAYnbLjBoLXVGyhGH5P2mQOvYtqUw';

var Bot = require('node-telegram-bot-api'),
    bot = new Bot(token, { polling: true });

console.log('bot server started...');

bot.onText(/^\/say_hello (.+)$/, function (msg, match) {
  var name = match[1];
  bot.sendMessage(msg.chat.id, 'Hello ' + name + '!').then(function () {
    // reply sent!
  });
});


bot.onText(/^\/sum((\s+\d+)+)$/, function (msg, match) {
  var result = 0;
  match[1].trim().split(/\s+/).forEach(function (i) {
    result += (+i || 0);
  })
  bot.sendMessage(msg.chat.id, result).then(function () {
    // reply sent!
  });
});

bot.onText(/^^(bom\sdia\s)((.+))$/, function (msg, match) {
  var name1 = match[1];
  var name2 = match[2];
//var name3 = match[3];
  var bd1 = 'seus merda';

  bot.sendMessage(msg.chat.id, 'bom dia :' + name1+'/ '+name2 + '!').then(function () {
    // reply sent!
  });
});
