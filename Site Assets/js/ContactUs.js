"use strict";
var _siteUrl = "";
var _contactUsListDetails = [];
var _WebsitelistDetails=[];

$(document).ready(function () {
	document.title = "CENTER FOR CONFLICT AND HUMANITARIAN STUDIES";
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', contactUsStart);
});

function contactUsStart() {
	try {
		getListDetails(_listContact,function(resultTitle,resultDesc){
			$("#contentListTitle").text(resultTitle);
			$("#contentListDesc").text(resultDesc);
		});
	} catch (error) {
		console.error(error);
	}

	try {
		bindContactData();
	
	} catch (error) {
		console.error(error);
	}
}

function submitform() {
	if (!HasFormValidateErr()) {
	
		SaveContactData();
	}
	else {
		//Do Nothing
	}
}
function SaveContactData(){
	var listItemData = "";
	listItemData = {
		__metadata: { "type": "SP.Data.ContactUsListItem" },
		"Title": $("#firstname").val(),
		"ContactUsFName": $("#firstname").val(),
		"ContactUsLName": $("#lastname").val(),
		"ContactUsEmail": $("#email").val(),
		"ContactUsSubject": $("#subject").val(),
		"ContactUsMessage": $("#message").val()
	};

	var allItemsUrl= _spPageContextInfo.webAbsoluteUrl + "/_api/Web/Lists/GetByTitle('"+_listContact+"')/Items";
	SPRestCommon.GetAddListItemAjaxCall(allItemsUrl, _listContact, listItemData)
	.then(function(iar){
		alert("Contact Form Save succefully");
		$("#contactForm").modal("hide");
		ClearAllFields();
	})
	.fail(CommonUtil.OnRESTError);
}
function ClearAllFields() {
	$('#firstname').val("");
	$('#firstname').css("border-color", '#ccc');

	$('#lastname').val("");

	$('#email').val("");
	$('#email').css("border-color", '#ccc');

	$('#subject').val("");
	
	$('#message').val("");
	
	
}
function HasFormValidateErr() {
	var has_error = false;
	var is_errored = false;

	var email = $("#email").val();
	is_errored = (IsNullOrEmpty(email));
	SetBorderColor("email", is_errored);
	has_error = (is_errored || has_error);

	var firstname = $("#firstname").val();
	is_errored = (IsNullOrEmpty(firstname));
	SetBorderColor("firstname", is_errored);
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


function bindContactData(){
	var context = new SP.ClientContext.get_current();
	var web = context.get_web();
	var WebsiteConnectList = web.get_lists().getByTitle(_listWebsite);
			
	var camlQuery = new SP.CamlQuery();
    camlQuery.set_viewXml(
                          "<View><RowLimit>1</RowLimit></View>");	
	var WebsiteConnectListItems = WebsiteConnectList.getItems(camlQuery);
	context.load(WebsiteConnectListItems);
	context.executeQueryAsync(
		function(){
			var WebSiteConnectenum = WebsiteConnectListItems.getEnumerator();
			var innerData = "";
		
			while(WebSiteConnectenum.moveNext()){
				
				var currentItem = WebSiteConnectenum.get_current();
				var ID = currentItem.get_item("ID");
				var Title = currentItem.get_item("Title")==undefined?"":currentItem.get_item("Title");
				var ContactUsVenue = currentItem.get_item("ContactUsVenue")==undefined?"":currentItem.get_item("ContactUsVenue");
				var ContactUsPhone = currentItem.get_item("ContactUsPhone")==undefined?"":currentItem.get_item("ContactUsPhone");
				var ContactUsEmail = currentItem.get_item("ContactUsEmail")==undefined?"":currentItem.get_item("ContactUsEmail");
				var ContactUsMapHtml = currentItem.get_item("ContactUsMapHtml")==undefined?"":currentItem.get_item("ContactUsMapHtml");
			
				$("#ContactHeading").text(Title);
				$("#ContactAddress").text(ContactUsVenue);
				$("#ContactNo").text(ContactUsPhone);
				$("#ContactEmail").text(ContactUsEmail);

				$("#contactmap").append(ContactUsMapHtml);
			
			}
			
			
		},
		function(){
			console.log('error');
		}
	);
}

