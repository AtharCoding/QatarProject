"use strict";
var _siteUrl = "";

$(document).ready(function () {
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext');
});
function Subscribe() {
	
	if (!HasEmailValidateErr()) {
		var email = $("#SubscribeEmail").val();
		var urlForEmailSubscribersList = _siteUrl + "/_api/web/lists/getbytitle('" + _listEmailSubscribers + "')/items?$filter=(Title eq '"+email+"')";
		var get_EmailSubscribersList = SPRestCommon.GetItemAjaxCall(urlForEmailSubscribersList);

		$.when(get_EmailSubscribersList)
		.then(function (respEmailSubscribersList) {
			if(respEmailSubscribersList.d.results.length>0){
				alert("You Are already subscribed");
				$('#SubscribeEmail').val("");
				$('#SubscribeEmail').css("border-color", '#ccc');
			}
			else{
				
				//save data to list
				var listItemData = "";
				listItemData = {
					__metadata: { "type": "SP.Data.EmailSubscribersListItem" },
					"Title": $("#SubscribeEmail").val(),
				};

				var allItemsUrl= _spPageContextInfo.webAbsoluteUrl + "/_api/Web/Lists/GetByTitle('" + _listEmailSubscribers + "')/Items";
				SPRestCommon.GetAddListItemAjaxCall(allItemsUrl, _listEmailSubscribers, listItemData)
				.then(function(iar){
					alert("Subscribtio has been succefully submitted");
					//$("#contactForm").modal("hide");
					$('#SubscribeEmail').val("");
					$('#SubscribeEmail').css("border-color", '#ccc');
				})
				.fail(CommonUtil.OnRESTError);
			}
		}).fail(CommonUtil.OnRESTError);
	}	
}

function HasEmailValidateErr() {
	var has_error = false;
	var is_errored = false;

	var SubscribeEmail = $("#SubscribeEmail").val();
	is_errored = (IsNullOrEmpty(SubscribeEmail));
	SetBorderColor("SubscribeEmail", is_errored);
	has_error = (is_errored || has_error);

	return has_error;
}
function IsNullOrEmpty(obj) {
	return (obj === undefined || obj === null || obj === "");
}
function SetBorderColor(elemendId, isErrored) {
	var border_color = isErrored ? "red" : "#ccc";
	$("#" + elemendId).css("border-color", border_color);
}
