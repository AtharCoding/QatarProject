"use strict";
var _siteUrl = "";
var _partnerShipsListDetails = [];
var _partnerShipsListData = [];

$(document).ready(function () {
	document.title = "CENTER FOR CONFLICT AND HUMANITARIAN STUDIES";
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', partnerStart);
});

function partnerStart() {
  
	try {
		getListDetails(_listTitleBusinessPartner,function(resultTitle,resultDesc){
			$("#contentListTitle").text(resultTitle);
			$("#contentListDesc").text(resultDesc);
		});

		bindPartnerData();
	} catch (error) {
		console.error(error);
	}
	
	//For sharing site
	let metaTitle="Partnership";
	let metaDesc="Motife Partnership";
	let metaImageUrl=_spPageContextInfo.webLogoUrl;
	$("head").append("<meta property='og:title' content='"+metaTitle+"'>");
	$("head").append("<meta property='og:description' content='"+metaDesc+"'>");
	$("head").append("<meta property='og:image' content='"+metaImageUrl+"'>");
	$("head").append("<meta name='twitter:card' content='"+metaDesc+"'>");
}

function bindPartnerData(){
	var context = new SP.ClientContext.get_current();
	var web = context.get_site().get_rootWeb();
	var PartnerList = web.get_lists().getByTitle("BusinessPartner");
			
	var camlQuery = new SP.CamlQuery();
    camlQuery.set_viewXml(
                          "<View><Query>" +
                          "<OrderBy><FieldRef Name='Created' Ascending='FALSE'/></OrderBy>"+
                          "</Query></View>");	
	var PartnerListListItems = PartnerList.getItems(camlQuery);
	context.load(PartnerListListItems);
	context.executeQueryAsync(
		function(){
			var Partnerenum = PartnerListListItems.getEnumerator();
			var innerData = "";
		
			while(Partnerenum.moveNext()){
				
				var currentItem = Partnerenum.get_current();
				var ID = currentItem.get_item("ID");
				var Title="";
				var BusinessPartnerDesc="";
				if(currentItem.get_item("Title")!=undefined){
					Title= isArabic ? SlicingTitle(currentItem.get_item("ArabicBusinessTitle")): SlicingTitle( currentItem.get_item("Title"));
				}
				if(currentItem.get_item("BusinessPartnerDesc")!=undefined){
					BusinessPartnerDesc= isArabic ? SlicingDesc(currentItem.get_item("ArabicBusinessDesc")): SlicingDesc( currentItem.get_item("BusinessPartnerDesc"));
				}
				var ImageUrl = currentItem.get_item("ImageUrl")==undefined?"":getImageSrcValue(currentItem.get_item("ImageUrl"));
				innerData = innerData+"<div class='col-lg-4'>"+
                                            "<div class='partner'>"+
                                                "<a href='#'>"+
                                                    "<div class='partner-img'>"+
                                                        "<img src="+ImageUrl+" />"+
                                                    "</div>"+
                                                    "<div class='partner-content'>"+
                                                        "<h3>"+Title+"</h3>"+
                                                        "<p>"+BusinessPartnerDesc+"</p>"+
                                                    "</div>"+
                                                "</a>"+
                                            "</div>"+
                                        "</div>";
			}
			
			$("#PartnerSection").append(innerData);
		},
		function(){
			console.log('error');
		}
	);
}
