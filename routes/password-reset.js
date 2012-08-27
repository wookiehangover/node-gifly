var config = require('../config');

var nodemailer = require('nodemailer');
var mailer = nodemailer.createTransport(config.mailTransportType,
                                        config.mailTransportSettings);
var from = config.from;

module.exports = function(router, client){

  router.add('user/forgot-password', function(req, res){
    if( req.method !== 'POST' ){

      req.session.get(function(sess){
        if( sess && sess.auth ){
          return res.redirect('/user/profile/edit');
        }

        res.parseBody(function( data ){
          client.hgetall('user:email:'+ data.email, function(err, result){
            mailer.sendMail({
              to: data.email,
              from: from,
              text: 'wuuuut'
            }, function(err, result){
              if(err){
                console.error(err);
                console.trace();
                return res.error(500);
              }
              res.json('', 204);
            });
          });
        });
      });

    } else {
      res.error(405);
    }
  });

};

