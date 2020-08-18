"use strict";
var _siteUrl = "";
var ctx;
var publicMgtList;
var publicMgtCamlQuery;
var listItems;
var itemLimit=5;
var publicMgtCollections={
	RetrieveResultsets:[],
	MainResultSet:[],
	NextResultPosition:0,
	StartIndex:0,
	EndIndex:0	
};
var isRefreshData=false;
$(document).ready(function () {
	document.title = "Public Management";
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', PublicManagementStart);
});


function PublicManagementStart() {
	getListDetails(_listTitlePublicManagement);
	bindPublicMgtData("");
	bindLoadMoreEvent();
}

function bindPublicMgtData(whereQuery){
	if(isRefreshData)
		$("#publicMgtContent").html("");

	publicMgtCollections.RetrieveResultsets=[];
	publicMgtCollections.MainResultSet=[];
	publicMgtCollections.NextResultPosition="";
	publicMgtCollections.StartIndex=0;
	publicMgtCollections.EndIndex=0;

	ctx = SP.ClientContext.get_current();
	publicMgtList = ctx.get_site().get_rootWeb().get_lists().getByTitle(_listTitlePublicManagement);
	publicMgtCamlQuery = new SP.CamlQuery();
	let query = "<View><Query><OrderBy><FieldRef Name='IsFeatured1' Ascending='False' /><FieldRef Name='Modified' Ascending='False'/></OrderBy>";
	if(whereQuery)
		query += whereQuery;
	query += "</Query><RowLimit>"+itemLimit+"</RowLimit></View>";
	publicMgtCamlQuery.set_viewXml(query);
	listItems = publicMgtList.getItems(publicMgtCamlQuery);
	ctx.load(listItems);
	ctx.executeQueryAsync(function(){
		publicMgtCollections.StartIndex=0;
		publicMgtCollections.EndIndex=listItems.get_count();
		publicMgtCollections.NextResultPosition=listItems.get_listItemCollectionPosition();
		loadMoreHideShow();
		fillPublicMgtItems();
	},failure);
}

function fillPublicMgtItems() {
	for (let i = 0; i < listItems.get_count(); i++) {
		let tempObj = {};
		let eachPublicMgt = listItems.getItemAtIndex(i);
		tempObj.Index = i;
		tempObj.ID = eachPublicMgt.get_item('ID');
		if(isArabic){
			tempObj.Title = SlicingTitle(eachPublicMgt.get_item('ManagementArabicTitle'));
			tempObj.PublicMgtDetails =SlicingDesc($("<div></div>").append(eachPublicMgt.get_item('ManagementArabicContent')).text());
			tempObj.learnMore="قراءة المزيد";
		}
		else{
			tempObj.Title =SlicingTitle(eachPublicMgt.get_item('Title'));
			tempObj.PublicMgtDetails =SlicingDesc($("<div></div>").append(eachPublicMgt.get_item('ManagementContent')).text());
			tempObj.learnMore="Learn MOre";
		}
		let imgStr = eachPublicMgt.get_fieldValues()['ImageUrl'];
		if (imgStr)
			tempObj.ImageUrl = getImageSrcValue(imgStr);

		publicMgtCollections.RetrieveResultsets.push(tempObj);
		publicMgtCollections.RetrieveResultsets.sort(function (a, b) { return a.Index - b.Index; });
		let mainLength = publicMgtCollections.MainResultSet.length;
		if (mainLength > 0) {
			$.each(publicMgtCollections.RetrieveResultsets, function () {
				this.Index = mainLength + this.Index;
			});
		}
		publicMgtCollections.MainResultSet = publicMgtCollections.MainResultSet.concat(publicMgtCollections.RetrieveResultsets);
		publicMgtCollections.RetrieveResultsets = [];
	}
	fillPublicMgtHtml(publicMgtCollections.MainResultSet, publicMgtCollections.StartIndex, publicMgtCollections.EndIndex);
	loadMoreHideShow();
}

function fillPublicMgtHtml(resultSet,startIndex,endIndex){
	for (let i = startIndex; i < endIndex; i++) {
		let eachPublicMgt = resultSet[i];

		let publicMgtDetailUrl = _siteUrl +(isArabic?"/Ar/Pages/":"/Pages/")+ "PublicManagementDetails.aspx?ItemID=" + eachPublicMgt.ID;
		let publicMgtDetails = eachPublicMgt.PublicMgtDetails;
		let publicMgtTitle = eachPublicMgt.Title;
		let publicMgtImageUrl = eachPublicMgt.ImageUrl;
		let learnMore=eachPublicMgt.learnMore;

		var eachPublicMgtContent="<a href='"+publicMgtDetailUrl+"'>"+
											"<div class='post-list-item'>"+
												"<div class='row'>"+
													"<div class='col-lg-4'>"+
														"<div class='post-list-item-img'>"+
															"<img src='"+publicMgtImageUrl+"'>"+
														"</div>"+
													"</div>"+
													"<div class='col-lg-8'>"+
														"<div class='post-list-content'>"+
															"<h2>"+publicMgtTitle+"</h2>"+
															"<p>"+publicMgtDetails+"</p>"+
															"<span class='go-link'>"+learnMore+"</span>"+
														"</div>"+
													"</div>"+
												"</div>"+
											"</div>"+
										"</a>";
		$("#publicMgtContent").append(eachPublicMgtContent);
	}
}

function bindLoadMoreEvent(){
	$("#publicMgtLoadMore").on("click",function(){
		isRefreshData=false;
		if (publicMgtCollections.NextResultPosition != null) {
			publicMgtCamlQuery.set_listItemCollectionPosition(publicMgtCollections.NextResultPosition);
			listItems = publicMgtList.getItems(publicMgtCamlQuery);
			ctx.load(listItems);
			//Call the same function recursively until all the items in the current criteria are fetched.
			ctx.executeQueryAsync(function(){
				publicMgtCollections.NextResultPosition=listItems.get_listItemCollectionPosition();
				publicMgtCollections.StartIndex=publicMgtCollections.EndIndex;
				publicMgtCollections.EndIndex=publicMgtCollections.StartIndex+listItems.get_count();
				fillPublicMgtItems();
			}, failure);
		}
	});
}
function loadMoreHideShow(){
	if(publicMgtCollections.NextResultPosition==null || publicMgtCollections.MainResultSet.length==0)
		$("#publicMgtLoadMore").hide();
	else
		$("#publicMgtLoadMore").show();
}