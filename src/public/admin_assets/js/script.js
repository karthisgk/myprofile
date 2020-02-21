
var getApiUrl = () => {return window.location.protocol + '//' + window.location.host};


var malert = (msg, err = false) => {
	$('.malert').show();
	if($('.malert span').eq(1).length > 0)
		$('.malert span').eq(1).remove();
	$('.malert p.mclose').off('click').click(() => {
		$('.malert').hide();
	});
	if(err){
		$('.malert')
		.removeClass('msuccess')
		.addClass('merror')
		.append('<span>' + msg + '</span>');
	}
	else{
		$('.malert')
		.removeClass('merror')
		.addClass('msuccess')
		.append('<span>' + msg + '</span>');
	}
};

var $getSpinner = () => {return $('<i class="fa fa-spinner fa-spin"></i>')};

var submitLogin = function(e){
	e.preventDefault();
	$(this)
	.html($getSpinner())
	.off('click');
	$.ajax({
		url: getApiUrl() + '/sgk/login',
		type: 'post',
		data: {userName: $('#user-name').val(), password: $('#password').val()},
		dataType: 'json',
		success: function(resp){
			const {code, data: {accessToken}, message} = resp;
			$(e.currentTarget).html('Login').click(submitLogin);
			if(code == 'SGK_020'){
				malert(message);
				location.reload();
			}else{
				malert(message, true);
			}
		}
	});
}

var ajx = function(req, d){
	reqUrl = getApiUrl();
	var xhr = new XMLHttpRequest();
	xhr.open(typeof req.method == 'undefined' ? 'GET' : req.method, reqUrl + req.path);
	if(typeof req.token != 'undefined')
		xhr.setRequestHeader('token', req.token);
	xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
	xhr.send(d);
	return xhr;
}

var logOut = function(e){
	e.preventDefault();
	$.get(getApiUrl() + '/sgk/logout', () => {location.reload()});
}

var downloadFile = function(e){
	e.preventDefault();
	var link = document.createElement("a");
	var targetFile = document.getElementById('target-file').value;
	if(targetFile.trim() == '')
		return;
    link.download = targetFile.split('/')[targetFile.split('/').length - 1];
    link.href = getApiUrl() + '/sgk/getfile?file=' + targetFile;
    link.click();
};

var uploadFile = function(e) {
	e.preventDefault();	
	var targetFile = document.getElementById('target-file').value;
	var file = $('#upload-file')[0].files;

	if(file.length == 0 || targetFile.trim() == '')
		return;

	var fd = new FormData();
	fd.append('targetfile', targetFile);
	fd.append('file', file[0]);
	var xhr = ajx({
		method: 'post',
		path: '/sgk/uploadfile'	
	}, fd);
	xhr.upload.onprogress = (evt) => {
		var percentComplete = parseInt((evt.loaded / evt.total ) * 100);
		toggleProgressBar(percentComplete);
	};
	xhr.upload.onloadstart = (evt) => {
		toggleProgressBar(0);
	};
	xhr.upload.onloadend = (evt) => {
		toggleProgressBar(100);
	};
	xhr.addEventListener("load",(evt) => {
		const { code, message, data } = JSON.parse(xhr.responseText);
		malert(message, code != 'SGK_001');
	});
};

var toggleProgressBar = function(val, ele = '') {
	if(!ele) {
		ele = $('.myProgress');
	}
	if(ele.hasClass('show') && val == 0) {
		ele.removeClass('show').addClass('hide');
	} else {
		ele.removeClass('hide').addClass('show');
		ele.children().text(val);
		ele.children().css('width', (val + '%'));
	}
	if (val >= 100) {
		setTimeout(() => ele.removeClass('show').addClass('hide'), 2000);
	}
	return ele;
}

var appendAbout = function(e){
	var aboutTtext = $('#about-text').val();
	if(aboutTtext.trim() == '')
		return;
	var ele = $('<li><p>' + aboutTtext + '</p></li>');
	$('#mabout-me').append(ele);
	var close = $('<a href="#" >close</a>');
	ele.append(close);
	close.click(function(e) {
		e.preventDefault();
		$(this).parent().remove();
	});
	$("#mabout-me").animate({ 
        scrollTop: ele.offset().top 
    }, 1000);
    $('#about-text').val('');
};

var submitAbout = function(e) {
	if($("#mabout-me").children().length == 0)
		return;
	var aboutMe = [];
	$.each($("#mabout-me").children(), function(k, ele){
		aboutMe.push($(ele).find('p').text());
	});
	$(this)
	.html($getSpinner())
	.off('click');
	$.ajax({
		url: getApiUrl() + '/sgk/saveabout',
		type: 'post',
		data: {aboutMe: aboutMe},
		dataType: 'json',
		success: function(resp){
			const {code, message} = resp;
			$(e.currentTarget).html('Login').click(submitAbout);
			if(code == 'SGK_001'){
				malert(message);
			}else{
				malert(message, true);
			}
		}
	});
};

var saveEditor = function(e) {
	$(this)
	.html($getSpinner())
	.off('click');
	$.ajax({
		url: getApiUrl() + '/sgk/editor',
		type: 'post',
		data: {styles: cssEditor.getValue(), content: htmlEditor.getValue()},
		dataType: 'json',
		success: function(resp){
			const {code, message} = resp;
			$(e.currentTarget).html('Save').click(saveEditor);
			if(code == 'SGK_001'){
				malert(message);
			}else{
				malert(message, true);
			}
		}
	});
};

$(document).ready(function(){
	$('#login-form').submit(submitLogin);
	$('#login-btn').off('click').click(submitLogin);
	$('#logout-btn').off('click').click(logOut);
	$('#download-btn').click(downloadFile);
	$('#upload-btn').click(uploadFile);
	$('#append-about').click(appendAbout);
	$('#submit-about').click(submitAbout);
	$("#mabout-me").children().find('a').click(function(e) {
		e.preventDefault();
		$(this).parent().remove();
	});
	$('.editor-save').click(saveEditor);
});