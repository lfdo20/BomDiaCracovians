var fs       = require('fs');
var moment   = require('moment');
var request  = require('request');
//var feed     = require('feed-read');
var dotenv   = require('dotenv');
var Dropbox  = require('dropbox');
var Twit = require('twit');

//local setup
  //dotenv.load();

// Telegram api config
  var Bot = require('node-telegram-bot-api'),  bot = new Bot(process.env.BOT_TOKEN, { polling: true });

// Global Var
  let bddata={}, newBdia, newbdv, newptv, newBdiaCount=0, newgifCount=0, rgifcount=0;
  let dropfilesurl = [[process.env.DROP_DATA,'data.json','bddata'],[process.env.DROP_GIF,'gifdata.json', 'gifdata']];
  let gifdata={
    'newgif':[],
    'ckdgif':[],
    'lastgif': []
  };

// Time config
  var nowDay = () => moment().format('ddd');
  var sTime = new moment('14:00', 'HHmm'); // 14:00
  var eTime = new moment('23:59', 'HHmm'); // 23:59

// Dropbox Config
  var dbx = new Dropbox({
    key: process.env.DROPBOX_APP_KEY,
    secret: process.env.DROPBOX_APP_SECRET,
    accessToken: process.env.DROPBOX_TOKEN,
    sandbox: false
  });

// Twitter Integration
  var T = new Twit({
    consumer_key:         process.env.TWITTER_CONSUMER,
    consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
    access_token:         process.env.TWITTER_TOKEN,
    access_token_secret:  process.env.TWITTER_TOKEN_SECRET,
    timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  });
  var streamTwit = T.stream('user');
  streamTwit.on('tweet', tweetReply);

// Seção de Notas
  // IDEA: organizar como o bot será utilizado em vários grupos: arquivos diferentes ? mesclar bases de dados ?
  // IDEA: json não trabalha com " " dá problema, tem que converter regex pra detectar : (.+)(')(.+)(')(.+)?

  console.log('bot server started...');

// pega o arquivo no dropbox e transforma em objeto
  startRead();
  function startRead(){
      //bddata = JSON.parse(require('fs').readFileSync('data.json', 'utf8'));
    for (let id of dropfilesurl) {
      //console.log(id[2]);
      dbx.sharingGetSharedLinkFile({ url: id[0] })
          .then(function (data) {
            //console.log(id[0], data);
            fs.writeFileSync(data.name, data.fileBinary, 'binary', function (err) {
              if (err) { throw err; }else{
              //console.log('File: ' + data.name + ' saved.');
              }
            });
            if (id[2] === 'bddata') {
                bddata = JSON.parse(require('fs').readFileSync('data.json', 'utf8'));
            }else if (id[2] === 'gifdata'){
                gifdata = JSON.parse(require('fs').readFileSync('gifdata.json', 'utf8'));
            }
          })
          .catch(function (err) {
            throw err;
          });
    }
  }

// comando para imagem do dia
  bot.onText(/^\/bdcdia$|^\/bdcdia@bomdiacracobot$/, function (msg, match) {
    var text='https://www.dropbox.com/s/77byqxoowpns5yl/bdcdia.jpg?raw=1';
    bot.sendPhoto(msg.chat.id, text).then(function () {
      // reply sent!
    });
  });

// comando para ultimos recebidos
  bot.onText(/^\/bdcultimos$|^\/bdcultimos@bomdiacracobot$/, function (msg, match) {
    var text='';
    for (var i = 0; i < bddata.latebdreceived.length; i++) {
      text += bddata.latebdreceived[i]+"\n";
    }
    bot.sendMessage(msg.chat.id, text).then(function () {
      // reply sent!
    });
  });

// comando para salvar arquivos
  bot.onText(/^\/bdcsave\s(data|gif)$/, function (msg, match) {
    if (match[1]==='data') {
      saveNewdata(bddata);
    }else if (match[1]==='gif') {
      saveNewdata(gifdata);
    }
    bot.sendMessage(msg.chat.id, 'Salvo!').then(function () {
    });
  });

// comando para help
  bot.onText(/^\/bdchelp$|^\/bdchelp@bomdiacracobot$/, function (msg, match) {
    var text =
    "Bom dia!" +"\n"+
    "Eu guardo toda a frase dita após 'bom dia'" +"\n"+
    "E respondo todos os bom dias com ou sem frases.." +"\n"+
    'mas ainda não entendo coisas loucas tipo "buónday".' +"\n"+
    "\n"+
    "\\bdcstatus - Ver a quantidades de bom dias no banco." +"\n"+
    "\\bdcadmin - Ver comandos de administração." +"\n"+
    "\\bdcultimos - Ver os ultimos bom dias adicionados" +"\n";
    bot.sendMessage(msg.chat.id, text).then(function () {
      // reply sent!
    });
  });

  bot.onText(/^\/bdcadmin\s(.+)$/, function (msg, match) {
    if (match[1] === process.env.ADM_PASS) {
      var text =
      "Comandos de manutenção:" +"\n"+
      "\n"+
      "\\bdccheck - Checar e validar os gifs recebidos. (X = quantidade)" +"\n"+
      "\\bdcsave - Salvar os arquivos de dados. (data | gif) " +"\n";
      bot.sendMessage(msg.chat.id, text).then(function () {
        // reply sent!
      });
    }else{
    var text = 'Senha errada.'
      bot.sendMessage(msg.chat.id, text).then(function () {
        // reply sent!
      });
    }
  });

// Recebimento de gifs putaria e contagem
  bot.on('document', (msg) => {
    if (nowDay() === 'Fri') { // check is is Fri
      if (msg.document.mime_type === 'video/mp4') {
        //console.log(msg.document);
        //var gifthumb = 'https://api.telegram.org/file/bot'+token+'/'+msg.document.thumb.file_path;
        var newGf = [msg.document.file_id, msg.document.file_size.toString()];
        //console.log(gifthumb);
        checkBdData(gifdata.newgif, newGf, 'gif');
        rgifcount +=1;
        console.log('Gif aleatório contador: '+rgifcount);
        if (rgifcount > 3) {
          if (moment().isBetween(sTime, eTime, 'minute', '[]')) {
            randomGif(msg);
            rgifcount = 0;
          }
        }
      }
    }else {
      return;
    }
  });

// NOTE: data não está detectando o dia após meia noite.

// função para lembrar que vai começar a putaria
  var endputsaid = 0;
  function putariaRemenber(msg, faltam) {
    //console.log(faltam);
    if (faltam <= 60 && endputsaid === 0) {
      bot.sendMessage(msg.chat.id, 'Faltam '+faltam+ ' minutos para acabar a putaria! 😭😭 ').then(function () {
        endputsaid=2;
      });
    } else if (faltam <= 20 && endputsaid === 2) {
      bot.sendMessage(msg.chat.id, 'Faltam '+faltam+' minutos para acabar a putaria! 😱😱 ').then(function () {
        endputsaid=4;
      });
    } else if (faltam <= 1 || faltam > 60 && endputsaid !== 0) { endputsaid = 0; }
  }

// comando para gifd tumblrs teste
    bot.onText(/^(pootaria)$/gi, function (msg, match) {
      // const uri = 'http://www.tumblviewr.com/Tumblr/Blog/goodgirlscangobad';
      // request(uri, function(err, res, body) {
      //   if (err) {console.log(err);}
      //   //console.log(body);
      //    var rgifl=[], rgiflist=[];
      //   body.replace(rgifrx, (match, p1, p2) => {
      //     //console.log(match, p1, p2);
      //     rgiflist.push(match);
      //     console.log(rgiflist);
      //   });
      // });
      randomGif(msg);
    });

// comando para gifs putaria
  var gftagrxdays = /^(p(u|o)+taria+)$/gi;
  var gftagrxfri = /^(.+)?(p(u|o)+taria+)(.+)?$/gi;
  var gftagrx = () => nowDay() === 'Fri' ? gftagrxfri : gftagrxdays;
  bot.onText(gftagrx(), function (msg, match) {
    if (nowDay() !== 'Fri') { // Correto é Fri
      bot.sendMessage(msg.chat.id, 'Hoje não é dia né. Tá achando que putaria é bagunça!?').then(function () {
      });
    } else {
      if (!moment().isBetween(sTime, eTime, 'minute', '[]')) {
        var faltam = Math.abs(moment().diff(sTime, 'minute'));
          faltam = faltam > 60 ? `${Math.floor(faltam/60)} h e ${faltam % 60} min` : `${faltam} min`;

        bot.sendMessage(msg.chat.id, `Caaaaalma, faltam ${faltam} para começar a putaria!`).then(function () {
        });
      }else{
        const gifrand = () => { return Math.floor(Math.random() * gifdata.ckdgif.length).toString()}
        function teste(cb) {
          gifdata.ckdgif.find((x) => {
            const gifNum = gifrand();
            if (gifdata.lastgif.every(y => y !== gifNum)) {
              gifdata.lastgif.shift();
              gifdata.lastgif.push(gifNum.toString());
              return cb = gifdata.ckdgif[gifNum][0];
            }
          });
          return cb;
        }
        let gifId = teste();
        if (gifId !== undefined) {
          bot.sendDocument(msg.chat.id, gifId).then(() => {
            newgifCount += 1;
            rgifcount += 1;
            if(newgifCount >= 5) {
              saveNewdata(gifdata);
              newgifCount = 0;
            }
          });
          }
        }
        }
  });

// NOTE: tumblr list pequena, feed parser com problema e só detecta alguns tumblrs

// função para putarias random tumblr
  var uri, ix = 0, rgifrx =/(h\S+\.gif(?!\'\)))/gi; ///(\<img src\=\")(h\S+gif(?!\"\/\<br))("\/\>)/gi;
  function randomGif(msg){
    //console.log(gifdata.tumblrgif.length);
    if (gifdata.tumblrgif.length > 0) {
      bot.sendDocument(msg.chat.id, gifdata.tumblrgif[0]).then(() => {
        //console.log('foi');
        gifdata.tumblrgif.shift();
        rgifcount = 0;
      });
    }else{
      if (gifdata.tumblrgif.length === 0) {
        getlink();
        function getlink(){
          //ix = gifdata.tumblrgif[gifdata.tumblrgif.length];
          //if (ix < gifdata.tumblrlist.length) {
            uri = gifdata.tumblrlist[ix][0].toString();
            //console.log('rgif : '+ix+' & '+uri);
            getFeed(uri,ix).then(function(ix){

            });
          //}
        }
        function getFeed(uri, ix){
          return new Promise((resolve, reject) => {

            request(uri, function(err, res, body) {
              if (err) {console.log(err);}
              body.replace(rgifrx, (match, p1, p2) => {
                gifdata.tumblrgif.push(match);
              });

              bot.sendDocument(msg.chat.id, gifdata.tumblrgif[0]).then(() => {
                gifdata.tumblrgif.shift();
                rgifcount = 0;
                ix = ix+1;
                gifdata.tumblrlist.pop();
                gifdata.tumblrlist.push(ix.toString());
                saveNewdata(gifdata);
              });
            });

            // feed(uri, function(err, fed) {
            //   if (err) {console.log(err);}
            //   //console.log(fed.length);
            //   var newpost = new moment(fed[fed.length-1].published);
            //   //console.log(gifdata.tumblrlist[ix][1]);
            //   var oldpost = new moment(gifdata.tumblrlist[ix][1].toString(), 'MMM DD YYYY');
            //   //console.log(newpost, oldpost);
            //   if (newpost > oldpost) {
            //     //console.log('ok novos posts');
            //     var rgifl=[], rgiflist=[], rtemp;
            //     //console.log(fed.length);
            //     for (var j = 0; j < fed.length; j++) {
            //       rgifl += fed[j].content;
            //     }
            //     //console.log(rgifl);
            //     rgifl.replace((rgifrx, match, p1, p2) => {
            //       //console.log(match, p1, p2);
            //       gifdata.tumblrgif.push(p2);
            //     });
            //     //console.log(gifdata.tumblrgif);
            //     //console.log(fed[fed.length-1].published);
            //     gifdata.tumblrlist[ix].pop();
            //     gifdata.tumblrlist[ix].push(fed[fed.length-1].published.toString().match(/(\w{3} \d{2} \w{4})/g, '$1').toString());
            //     ix = gifdata.tumblrlist.length+1;
            //     //console.log(gifdata.tumblrlist);
            //     //console.log(gifdata.tumblrgif);
            //     saveNewdata(gifdata);
            //     bot.sendDocument(msg.chat.id, gifdata.tumblrgif[0]).then(() => {
            //       gifdata.tumblrgif.shift();
            //       rgifcount = 0;
            //     });
            //   } else {
            //     //console.log('ok no posts');
            //     getlink(ix);
            //   }
            // });
          });
        }
      }
    }
  }

// NOTE:  comando para salvar todos os thumbs de gifs
  // var download = function(uri, filename, callback){
  // request.head(uri, function(err, res, body){
  //   console.log('content-type:', res.headers['content-type']);
  //   console.log('content-length:', res.headers['content-length']);
  //
  //   request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  // });
  // };
  //
  // download('https://www.google.com/images/srpr/logo3w.png', 'google.png', function(){
  // console.log('done');
  // });

// comandos para checar os gifs
  var ckgfid='', ckgfsize='', ckgfthlink='', checknum='';
  var endkeyboard = (msg) => {
    saveNewdata(gifdata);
    bot.sendMessage(msg.chat.id, 'Acabou.', {
      "reply_to_message_id": msg.message_id,
      "reply_markup": {
          "remove_keyboard": true,
          "selective": true
      }
    });
  }
  var newgfcheck = (msg) => {
    if (gifdata.newgif.length > 0 && checknum > 0) {
      ckgfid = gifdata.newgif[0][0];
      var uri = 'https://api.telegram.org/bot'+process.env.BOT_TOKEN+'/getFile?file_id='+ckgfid;
      request.get(uri,  { json: true }, function(err, res, body){
        console.log(body.result);
        ckgfsize=body.result.file_size;
        ckgfthlink='';
      })
      bot.sendDocument(msg.chat.id, ckgfid, {
        "reply_to_message_id": msg.message_id,
        "reply_markup": {
          "keyboard": [["👍 Sim", " 👎 Não"],   ["👈 Pular"]],
          "selective": true
        }
      }).then(function(){
        checknum -=1;
        // bot.getFile(ckgfid, function(res){
        //   console.log(res);
        // }).then(function(){
        //});
      });
    }else{
      endkeyboard(msg);
    }
  }
  bot.onText(/^\/bdccheck(\s)(\d+)$/, function (msg, match) {
    checknum = match[2]
    newgfcheck(msg);
  });

// comando para analisar várias mensagens recebidas e distribuir as funções
  var putexec = false, putstartcheck=false, vcmsg='';
  bot.on( 'message', (msg) => {
    if (nowDay() === 'Fri') {
        var putariaCalc = (function(msg) {
          return function(msg) {
            if (!putexec) {
              var timeS = moment.unix(msg.date).format("HH");
              if (timeS === '23') {
                var faltam = Math.abs(moment().diff(eTime, 'minute'));
                putariaRemenber(msg, faltam);
              }else if (timeS === '13') { //13
                //var timeS = moment.unix(msg.date).format("mm");
                var faltam = moment().diff(new moment('14:00', 'HHmm'), 'minute')*-1;
                console.log('t3 ', faltam); //sTime
                if (faltam < 30 && faltam > 0 && !putstartcheck) {
                  putstartcheck=true;
                  vcmsg=msg.chat.id;
                  console.log(msg, vcmsg, timeS, faltam);
                  setTimeout((msg, faltam)=>{
                    bot.sendAudio(vcmsg, 'CQADAQADCgAD9MvIRuM_NpJIg6-YAg'); //msg.chat.id
                    setTimeout(()=>{ putstartcheck=false;},60000);
                  },(faltam*60)*1000);
                }
              }
              putexec = true;
              setTimeout(()=>{ putexec = false;},3000);
            }
          };
        })();
        putariaCalc(msg);
    }
    if (checknum !== '') {
      //console.log(msg);
      var cks = "👍 sim";
      if (msg.text.toString().toLowerCase().indexOf(cks) === 0) {
        console.log('ok sim');
        gifdata.newgif.shift();
        var temp=[ckgfid, ckgfsize.toString()];
        gifdata.ckdgif.push(temp);
        //console.log(gifdata.ckdgif);
        newgfcheck(msg);
      }

      var ckn = "👎 não";
      if (msg.text.toString().toLowerCase().indexOf(ckn) === 0) {
        console.log('ok não');
        gifdata.newgif.shift();
        newgfcheck(msg);
      }

      var ckr = "👈 pular";
      if (msg.text.toString().toLowerCase().indexOf(ckr) === 0) {
        console.log('ok pula');
        gifdata.newgif.shift();
        gifdata.newgif.push(ckgfid);
        newgfcheck(msg);
      }
    }
  });

// comando para Hoje é dia quê
  var hjmessage, hjdiarx = /^(\w+(?=\s)\s)?((hoje|hj)|(que|q))?(.{3}|.)?((dia)|(hoje|hj)|(que|q))(.{4}|.{3})((dia)|(hoje|hj)|(que|q))$/gi;
  bot.onText(hjdiarx, function (msg, match) {
    var tp1 = match[6]; //dia
    var tp2 = match[11] // q que ou hoje
    if (tp1==='dia' && tp2.match(/^(q|que|hoje|hj)$/)) {
      switch (nowDay()) {
        case 'Sun':
          hjmessage =
          "🍰🍷 DOMINGO MIÇANGUEIRO CREATIVO DA POHRA 🎨"+"\n"+
          "Pornfood e artes"+"\n"+
          "(desenhos, textos, fotos de paisagens, pets, etc)"+"\n"+
          +" "+"\n";
          break;
        case 'Mon':
          hjmessage =
          "🎧 segunda feira spatifou 🎤"+"\n"+
          "Músicas, artistas, playlists e karaoke"+"\n"+
          " "+"\n";
          break;
        case 'Tue':
          hjmessage =
          "📷 terça feira ególatra 💆"+"\n"+
          "Egoshot, histórias pessoais e desabafos"+"\n"+
          " "+"\n";
          break;
        case 'Wed':
          hjmessage =
          "😂 quarta feira gozada 👌"+"\n"+
          "Piadas, twits, prints..."+"\n"+
          " "+"\n";
          break;
        case 'Thu':
          hjmessage =
          "📢 QUINTA FEIRA RADIO DE INTERNETE 📻"+"\n"+
          "Episódios de podcast pra indicar, lolicast e audiozaços..."+"\n"+
          " "+"\n";
          break;
        case 'Fri':
          hjmessage =
          "🍆 sEXTA XERA SEN REGRAS 💦"+"\n"+
          "De dia: Cracolês e tretas (ou não)"+"\n"+
          "De noite: Nudeshot e putaria (ou sim)"+"\n"+
          " "+"\n"+
          "Envio gifs salvos quando se fala putaria."+"\n"+
          "Envio gif random a cada 3 gifs que vcs mandam."+"\n",
          " "+"\n";
          break;
        case 'Sat':
          hjmessage =
          "🎮 QUAL É A BOA / BOSTA DE SÁBADO ? 🎥"+"\n"+
          "(des) indicações pro fim de semana"+"\n"+
          " "+"\n";
          break;
      }
      bot.sendMessage(msg.chat.id, hjmessage).then(function () {
      });
    }
  });

// comando para verificar bom dias
  bot.onText(/^\/bdcstatus$|^\/bdcstatus@bomdiacracobot$/, function (msg, match) {
    var text = 'Nós temos '+bddata.bomdia.length+' bom dias.'+'\n'+
    'Nós temos '+gifdata.ckdgif.length+' gifs.'+'\n'+
    'Nós temos '+gifdata.newgif.length+' novos gifs para validar.'+'\n'+
    'Nós temos '+gifdata.tumblrlist.length+' tumbler links.'+'\n'+
    ' '+'\n';
    bot.sendMessage(msg.chat.id, text).then(function () {
      // reply sent!
    });
  });

// NOTE: buscar um novo algoritmo randomGif

// listen de bom dias
  var bdrx = /^(((bo|bu)(\w+)?)(\s?)((di|de|dj)\w+))(\s?|\.+|,|!|\?)?(\s)?(.+)?$/gi;
  bot.onText(bdrx, function (msg, match) {
    newbdv = match[1];
    newptv = match[8];
    newBdia = match[10];
    var bdiaback;

    // checa por arrobas que não podem
    if (newBdia !== undefined) {
      var notBdia = newBdia.match(/(\@)/gi, '$1');
    }

    // check se o bom dia foi dado corretamente
    if (newBdia === undefined) {
      newBomDia();
      saveLastSay();
      }else if(notBdia !== null){
        var bdiaback = "NOT. Just Not."+'\n'+"Nada de marcar pessoas e botar o meu na reta.";
      }else{
        newBomDia();
        saveLastSay();
        saveLastListen();
    }

    // Gera um bom dia ramdom do banco e checa com os últimos falados.
    function newBomDia(){
      for (var i = 0; i < bddata.bomdia.length; i++) {
        var bdnum = Math.floor(Math.random() * bddata.bomdia.length);
        var bdvnum = Math.floor(Math.random() * bddata.bdiasvar.length);
        var ptvnum = Math.floor(Math.random() * bddata.pontosvar.length);
        var lbds = bddata.latebdsay.findIndex(function(str){
          if (str === bddata.bomdia[bdnum]) {
            return true;
          }else{
            return false;
          }
        });
        var lbdr = bddata.latebdreceived.findIndex(function(str){
          if (str === bddata.bomdia[bdnum]) {
            return true;
          }else{
            return false;
          }
        });
        if (lbds === -1 && lbdr === -1){
          i=bddata.bomdia.length;
          bdiaback = bddata.bdiasvar[bdvnum] + bddata.pontosvar[ptvnum] + bddata.bomdia[bdnum];
        }
      }
    }

    //Armazena ultimo bom dia falado
    function saveLastSay(){
      bddata.latebdsay.shift();
      bddata.latebdsay.push(newBdia);
    }

    //Armazena ultimo bom dia recebido
    function saveLastListen(){
      bddata.latebdreceived.shift();
      bddata.latebdreceived.push(newBdia);
      //console.log(bddata.latebdreceived);
      checkBdData(bddata.bomdia, newBdia, 'bomdia');
      checkBdvData(newbdv);
    }

    bot.sendMessage(msg.chat.id, bdiaback).then(function () {
      if (newBdia !== undefined) {
        newTwit(bdiaback);
      }
    });
  });

// Twitter sender
  function newTwit(status){
    T.post('statuses/update', { status: status }, function(err, data, response) {
    });
  }

// Twitter Replyer
  var bdrxtw = /^(@\w+\s)(((bo|bu)(\w+)?)(\s?)((di|de|dj)\w+))(\s?|\.+|,|!|\?)?(\s)?(.+)?$/gi;
  function tweetReply(tweet) {
    //if (!moment().isBetween(sTime, eTime, 'minute', '[]')) {
    var reply_to = tweet.in_reply_to_screen_name; // Who is this in reply to?
    var name = tweet.user.screen_name; // Who sent the tweet?
    var txt = tweet.text;// What is the text?
    var match = bdrxtw.exec(txt);

    if (name !== 'bomdiaabot' && match !== null) {

      // receber bom dia do twitter
      var newbdvtw = match[2];
      var newptvtw = match[9];
      var newBdiatw = match[11];
      checkBdData(bddata.bomdia, newBdiatw, 'bomdia');
      checkBdvData(newbdvtw);

      // enviar bom dia aleatória a um reply do twitter
      var bdnum = Math.floor(Math.random() * bddata.bomdia.length);
      var bdvnum = Math.floor(Math.random() * bddata.bdiasvar.length);
      var ptvnum = Math.floor(Math.random() * bddata.pontosvar.length);
      var bdiaback = bddata.bdiasvar[bdvnum] + bddata.pontosvar[ptvnum] + bddata.bomdia[bdnum];
      var reply = '@'+name+' '+bdiaback;
      T.post('statuses/update', { status: reply }, function(err, reply) {
        if (err !== undefined) {
          console.log(err);
        } else {
          console.log('Tweeted: ' + reply);
        }
      });
    }
  }

// checa se a frase de bom dia recebido já existe no banco
  function checkBdData(path, newBdia, origem){
    //console.log(newBdia, origem);
    if (origem ==='gif') {
      var existe = gifdata.ckdgif.findIndex(function(elem){
        //console.log(elem[1], newBdia);
        if (elem[1] === newBdia[1]){
          return true;
        }else{
          return false;
        }
      });
    } else{
      var existe = path.findIndex(function(elem){
        //console.log(elem, newBdia);
        if (elem === newBdia){
          return true;
        }else{
          return false;
        }
      });
    }
    // Adiciona bom dia no banco de bom dias
    if (existe === -1) {
      if (origem === 'gif'){
        path.push(newBdia);
        newgifCount +=1;
        console.log('Novo gif recebido: '+newgifCount, newBdia);
      }else{
        path.push(newBdia);
        newBdiaCount +=1;
        console.log('Novo bom dia recebido: '+newBdiaCount, newBdia);
      }
    }
    if (newBdiaCount >= 10){
      saveNewdata(bddata);
      newBdiaCount=0;
    } else if(newgifCount >= 10){
      saveNewdata(gifdata);
      newgifCount=0;
    }
  }

// checa se a variação de bom dia recebido já existe no banco
  function checkBdvData(newbdv){
    var existe = bddata.bdiasvar.findIndex(function(elem){
      // console.log(elem, newBdia);
      if (elem === newbdv){
        return true;
      }else{
        return false;
      }
    });

    // Adiciona bom dia no banco de bom dias
    if (existe === -1) {
      bddata.bdiasvar.push(newbdv);
      newBdiaCount +=1;
    }
    if (newBdiaCount > 10){
      saveNewdata(bddata);
      newBdiaCount=0;
    }
  }

// sava arquivo json com bom dias no dropbox a cada 10 novos
  function saveNewdata(dataVar){
    console.log(Object.keys(bddata).length, Object.keys(gifdata).length,  Object.keys(dataVar).length > 6 ? '/data.json': '/gifdata.json');
    var filename =  Object.keys(dataVar).length > 6 ? '/data.json' : '/gifdata.json';
    console.log(filename);
    let json = JSON.stringify(dataVar, null, 2);
    dbx.filesUpload({ path: filename, contents: json, mode:'overwrite' })
      .then(function (response) {
        console.log('Data Saved :'+filename);
        startRead();
      })
      .catch(function (err) {
        console.log('Error: ', err);
      });
  }
