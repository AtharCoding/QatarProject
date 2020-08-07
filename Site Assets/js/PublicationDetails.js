"use strict";
var _siteUrl = "";
var pubAuthIDsArr = [];

var numberOfPublication=3;
var _totalPubFromAuthor=0;
var _authorPublicationContentArr=[];

var _nextPubCollection=[];
$(document).ready(function () {
	document.title = "Publication Details";
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', pubDetailStart);
});

function pubDetailStart() {
	setupLanguage();
	const urlParams = new URLSearchParams(window.location.search);
	const itemID = urlParams.get('ItemID')?urlParams.get('ItemID'):urlParams.get('itemid');
	if (itemID != null) {
		bindPublication(itemID);

		var urlForCurrentPubAtt = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitlePublication + "')/items(" + itemID + ")/AttachmentFiles";
		var get_Current_Pub_Attch = SPRestCommon.GetItemAjaxCall(urlForCurrentPubAtt);

		var urlForNextPub = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitlePublication + "')/items?$filter=(ID gt " + itemID + ")&$top=1&$orderby=ID asc";
		var get_NextPub = SPRestCommon.GetItemAjaxCall(urlForNextPub);

		$.when(get_Current_Pub_Attch,get_NextPub)
			.then(function (respCurrentAttchments,respNextPub) {
				let _currentAttCollection = respCurrentAttchments[0].d.results;
				if (_currentAttCollection.length > 0) {
					for (let i = 0; i < _currentAttCollection.length; i++) {
						var urlForAttDetails = _siteUrl + "/_api/web/getfilebyserverrelativeurl('" + _currentAttCollection[i].ServerRelativeUrl + "')";
						var get_AttDetails = SPRestCommon.GetItemAjaxCall(urlForAttDetails);
						$.when(get_AttDetails)
							.then(function (respAttDetails) {
								let attResult = respAttDetails.d;
								var eachEventContent = "<a href='" + _siteUrl + "/_layouts/15/Download.aspx?SourceUrl=" + attResult.ServerRelativeUrl + "' class='attachment-download'>" +
									"<span class='attachment-icon'><i></i></span>" +
									"<div>" +
									"<span class='attachment-name'>" + attResult.Name + "</span><br>" +
									"<span class='attachment-details'>" + getSizeStr(attResult.Length) + "</span>" +
									"</div>" +
									"</a>";
								$("#pubAttachments").append(eachEventContent);
							});
					}
				}
				else
					$("#pubAttachments").hide();
				
				_nextPubCollection = respNextPub[0].d.results;
				if (_nextPubCollection.length > 0) {
					let nextPub = _nextPubCollection[0];
					let commonStartUrl=_siteUrl +(isArabic?"/Pages/Ar/":"/Pages/");
					$("#nextPubAnchor").attr("href", commonStartUrl+"PublicationDetails.aspx?ItemID=" + nextPub.ID);
					$("#nextPubAnchor").text(isArabic?nextPub.PublicationArabicTitle:nextPub.Title);
				}
				else
					$("#pubNextRead").hide();
			}, function (err) {
				console.error(err);
			});
	}
}

function bindPublication(itemID) {
	
	let ctx = SP.ClientContext.get_current();
	let list = ctx.get_web().get_lists().getByTitle(_listTitlePublication);
	let publicationItem = list.getItemById(itemID);
	ctx.load(publicationItem);
	ctx.executeQueryAsync(function () {
		var pubAuthorIDs = publicationItem.get_item('PublicationAuthorIDs');
		for (let j = 0; j < pubAuthorIDs.length; j++) {
			pubAuthIDsArr.push(pubAuthorIDs[j].get_lookupId());
		}
		if (pubAuthIDsArr.length > 0) {
			let tempObj = {};
			tempObj.Index = 0;
			tempObj.publicationItem = publicationItem;
			getStaffDetailsByQuery(createCamlQueryByIDArr(pubAuthIDsArr), tempObj, function (staffCollection, tempObj) {
				if (staffCollection.length > 0) {
					tempObj.staffCollection = staffCollection;
					fillPublicationDetails(tempObj);
				}
			}, function (err) {
				console.error(err);
			});

			bindAuthorPublications();
		}
	}, function (err) {
		console.error(err);
	});
}

function fillPublicationDetails(tempObj) {

	let publicationItem = tempObj.publicationItem;

	let pubDetails = $("<div></div>").append(isArabic?publicationItem.get_item('PublicationArabicDetails'):publicationItem.get_item('PublicationDetails')).html();
	let pubTitle = SlicingTitle(isArabic?publicationItem.get_item('PublicationArabicTitle'):publicationItem.get_item('Title'));
	let pubPreTitle = SlicingTitle(isArabic?publicationItem.get_item('PublicationArabicPreTitle'):publicationItem.get_item('PublicationPreTitle'));
	let pubPostTitle = SlicingTitle(isArabic?publicationItem.get_item('PublicationArabicPostTitle'):publicationItem.get_item('PublicationPostTitle'));
	let pubImageUrl = getImageSrcValue(publicationItem.get_fieldValues()['ImageUrl']);
	let pubDate = getFormattedDate(publicationItem.get_item('PublicationDate'));

	$("#pubTitle1,#pubTitle2,#pubTitle3").text(pubTitle);
	$("#pubPreTitle1,#pubPreTitle2").text(pubPreTitle);
	$("#pubPostTitle").text(pubPostTitle);
	$("#pubDate1,#pubDate2").text(pubDate);
	$("#pubImgUrl").attr("src", pubImageUrl+"?width=780&height=510");
	$("#pubContentDetails").html(formatRichTextValue(pubDetails));

	let staffCollection = tempObj.staffCollection;
	for (let j = 0; j < staffCollection.length; j++) {
		let eachStaff = staffCollection[j];
		let authorContent = "<div class='author-item'>" +
			"<img src='" + eachStaff.ImageUrl + "' />" +
			"<div>" +
			"<a href='" + eachStaff.ProfileDetailPageURL + "'>" +
			"<h4>" + eachStaff.Title + "</h4>" +
			"</a>" +
			"<p>" + eachStaff.StaffPositionLookup.Title + "</p>" +
			"</div>" +
			"</div>";
		$("#authorDetails").append(authorContent);
	}
}

function bindAuthorPublications() {

	let ctx = SP.ClientContext.get_current();
	let list = ctx.get_web().get_lists().getByTitle(_listTitlePublication);
	let camlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False'/><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	query += "<Where><In><FieldRef Name='PublicationAuthorIDs' LookupId='True' /><Values>";
	pubAuthIDsArr.forEach(function (id) {
		query += "<Value Type='Integer'>" + id + "</Value>";
	});
	query += "</Values></In></Where>";
	query += "</Query></View>";
	camlQuery.set_viewXml(query);

	let items = list.getItems(camlQuery);
	ctx.load(items);
	ctx.executeQueryAsync(function () {
		_totalPubFromAuthor = items.get_count();
		for (let i = 0; i < _totalPubFromAuthor; i++) {
			let tempObj={};
			tempObj.eachPublication = items.getItemAtIndex(i);
			tempObj.Index=i;
			fillAuthorPubDetails(tempObj);
		}
		bindAuthorPubHtml();
	}, function (err) {
		console.error(err);
	});
}

function fillAuthorPubDetails(tempObj) {

	let eachPublication = tempObj.eachPublication;
	let commonStartUrl=_siteUrl +(isArabic?"/Pages/Ar/":"/Pages/");

	let pubDetailUrl =commonStartUrl+"PublicationDetails.aspx?ItemID=" + eachPublication.get_item('ID');
	let pubTitle = SlicingTitle(isArabic?eachPublication.get_item('PublicationArabicTitle'):eachPublication.get_item('Title'));
	let pubDate="";
	let pubDateStr = eachPublication.get_item('PublicationDate');
	if(pubDateStr)
		pubDate=getFormattedDate(pubDateStr);

	let contentHtml = "<div class='related-list-item'>"+
							"<p class='related-date'>"+pubDate+"</p>"+
							"<a href='"+pubDetailUrl+"'>"+
								"<p class='related-title'>"+pubTitle+"</p>"+
							"</a>"+
						"</div>";
	let contentObj = {};
	contentObj.Index = tempObj.Index;
	contentObj.Content = contentHtml;
	_authorPublicationContentArr.push(contentObj);
}

function bindAuthorPubHtml() {
	let sortByIndex = _authorPublicationContentArr.sort(function (a, b) {
		return a.Index - b.Index;
	});
	for (let i = 0; i < sortByIndex.length; i++) {
		if (i == numberOfPublication)
			break;
		$("#moreFromAuthor").append(sortByIndex[i].Content);
	}
}

function setupLanguage(){
	let commonStartUrl=_siteUrl +(isArabic?"/Pages/Ar/":"/Pages/");
	$("#allPublicationAnchor").attr("href", commonStartUrl + "Publication.aspx");

	$("#downloadPubTitle").text(isArabic?"تنزيل المنشور:":"Download Publication:");
	$("#authorWidgetTitle").text(isArabic?"الكاتب":"Authors");

	$("#authorMoreTitle").text(isArabic?"المزيد من المؤلف":"More From the Author");
	$("#readNextTitle").text(isArabic?"اقرأ التالي":"READ NEXT");
}