
// # boot - email

var nodemailer = require('nodemailer')
var emailTemplates = require('email-templates')
var _ = require('underscore')
var async = require("async");

exports = module.exports = function(settings, logger, async) {

  // check to make sure we defined a default email object
  if (!_.isObject(settings.email))
    throw new Error('Settings did not have an `email` object')

  // check to make sure settings.email.templates is defined
  if (!_.isObject(settings.email.templates))
    throw new Error('Settings did not have a `settings.email.templates` object')

  // check to make sure settings.email.templates.dir is defined
  if (!_.isString(settings.email.templates.dir))
    throw new Error('Settings did not have a `settings.email.templates.dir` string')


  function renderTemplate(_templateName, _locals, _headers, transport, _callback) {
  	var templateName, locals, callback, transporter;
		logger.info('send email _headers: ', _headers);
		templateName = _templateName
		locals = _locals
		var headers = _headers
		callback = _callback

		// add ability to override default transport defined in settings
		if (_.isFunction(transport)) {

		  // check to make sure we defined a default transport object
		  if (!_.isObject(settings.email.transport))
			throw new Error('Settings did not have an `email.transport` object')

		  callback = transport

		  //
		  // if the transport defined in settings is an actual transport
		  // (as opposed to just a config object) then we need to use that
		  // instead of creating a transport - to do so we'll look for the
		  // `.transporter` property that gets added to all transport objects
		  // <https://github.com/andris9/Nodemailer/blob/master/src/nodemailer.js#L39>
		  //
		  // the reason we have this support added is in case users add plugins to
		  // their transporter, for example the `nodemailer-html-to-text` plugin
		  // <https://github.com/andris9/nodemailer-html-to-text>
		  //
		  if (_.has(settings.email.transport, 'transporter'))
			transporter = settings.email.transport
		  else
			transporter = nodemailer.createTransport(settings.email.transport)

		} else {
		  transporter = nodemailer.createTransport(transport)
		}

		if (_.isObject(settings.email.templates.options))
		  return emailTemplates(settings.email.templates.dir, settings.email.templates.options, createTemplate)

		emailTemplates(settings.email.templates.dir, createTemplate)
		
		function createTemplate(err, template) {
			if (err) throw err
			template(templateName, locals, createEmail(headers))
			
			function createEmail(headers) {
				  return function(err, html, text) {
					if (err) return callback(err);
					// if we defined a default headers object, then inherit it here
					// but only if we didn't set `useDefaults` to false in the headers
					if (_.isObject(settings.email.headers) && !headers.useDefaults) {
					  headers = _.defaults(headers, settings.email.headers);
					}

					if (headers.useDefaults === false) {
						headers.from = 'xxxxxxx';
					}
					
					  // JSON for SparkPost API
					// https://support.sparkpost.com/customer/portal/articles/1948014-how-to-add-cc-and-bcc-to-emails
					data = {
					  content: {
						from: headers.from,
						subject: headers.subject
					  },
					  recipients: [
						{"address": {"email": headers.to}},         // to
						{'address':{                                //cc
						  "email": headers.cc ? headers.cc : "",
						  "header_to": headers.to
						  }
						},
						{'address':{                                //cc
						  "email": headers.cc1 ? headers.cc1 : "",
						  "header_to": headers.to
						  }
						},
						{'address':{                                //cc
						  "email": headers.cc2 ? headers.cc2 : "",
						  "header_to": headers.to
						  }
						},
						{'address':{                                //cc
						  "email": headers.cc3 ? headers.cc3 : "",
						  "header_to": headers.to
						  }
						},
						{'address':{                                //cc
						  "email": headers.cc4 ? headers.cc4 : "",
						  "header_to": headers.to
						  }
						},
						{'address':{                                //cc
						  "email": headers.cc5 ? headers.cc5 : "",
						  "header_to": headers.to
						  }
						}
					  ]
					};

					if (Array.isArray(headers.bcc)) {
						for (var i = 0, len = headers.bcc.length; i < len; i++) {
							var emailAddress = headers.bcc[i];
							data.recipients.push({
								'address':{
								"email": emailAddress,
								"header_to": headers.to
								}
							});
						}
					} else if (headers.bcc && headers.bcc.length > 0 && headers.bcc.indexOf(',') > -1) {
						bccEmails = headers.bcc.split(',');
						for (var i = 0, len = bccEmails.length; i < len; i++) {
							var emailAddress = bccEmails[i];
							data.recipients.push({
								'address':{
								"email": emailAddress,
								"header_to": headers.to
								}
							});
						}
					} else if (headers.bcc && headers.bcc.length > 0) {
						data.recipients.push({
							'address':{
							"email": headers.bcc,
							"header_to": headers.to
							}
						});
					}

					if (_.isString(html)) {
					  data.content.html = html;
					}
					if (_.isString(text)) {
					  data.content.text = text;
					}

					logger.info('send email to: ', data.recipients);
					logger.info('send email subject: ', data.content['subject']);
					transporter.sendMail(data, callback)
				}
			  }
		  }
  }
  return renderTemplate

}

exports['@singleton'] = true
exports['@require'] = [ 'igloo/settings', 'igloo/logger', 'async' ]
