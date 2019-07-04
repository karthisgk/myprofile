
var getApiUrl = () => {return window.location.protocol + '//' + window.location.host};

var submitLogin = function(){
	console.log('trigerrred');
	$.ajax({
		url: getApiUrl() + '/sgk/login',
		type: 'post',
		data: {userName: $('#user-name').val(), password: $('#password').val()},
		dataType: 'json',
		success: function(resp){
			const {code, accessToken: {data}} = resp;
			console.log(accessToken);
			if(code == 'SGK_001'){

			}else{

			}
		}
	});
}

$(document).ready(function(){
	$('#login-btn').off('click').click(submitLogin);
});