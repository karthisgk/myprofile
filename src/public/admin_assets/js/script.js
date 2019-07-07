
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
			if(code == 'SGK_001'){
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
	xhr.onload = function(){
		try {
			var resp = JSON.parse(xhr.responseText);
			const {code, message} = resp;
			malert(message, code == 'SGK_001');
		}catch(e){
			malert('response error', true);
		}
	}
};

$(document).ready(function(){
	$('#login-btn').off('click').click(submitLogin);
	$('#logout-btn').off('click').click(logOut);
	$('#download-btn').click(downloadFile);
	$('#upload-btn').click(uploadFile);
});