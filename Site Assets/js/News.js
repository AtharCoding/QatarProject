"use strict";
var _siteUrl = "";
var _newsCollection = [];
var _newsListDetails = [];
$(document).ready(function () {
	document.title = "News";
	_siteUrl = _spPageContextInfo.webAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', newsStart);
});

function newsStart() {
    var urlForNewsList = _siteUrl + "/_api/web/lists/GetByTitle('"+_listTitleNews+"')";
    var get_NewsList = SPRestCommon.GetItemAjaxCall(urlForNewsList);

    var urlForNews = _siteUrl + "/_api/web/lists/GetByTitle('"+_listTitleNews+"')/items?$top=1000";
    var get_News = SPRestCommon.GetItemAjaxCall(urlForNews);
	
    $.when(get_NewsList,get_News)
    .then(function (respNewsList, respNews) {
		
		try {
			_newsListDetails = respNewsList[0].d;
			$("#contentListTitle").text(_newsListDetails.Title);
			$("#contentListDesc").text(_newsListDetails.Description);
		} catch (error) {
			console.error(error);
		}

		try{
			_newsCollection=respNews[0].d.results;
			getImageUrl(_newsCollection[0],0,function(resultImgUrl,eachNews){

				let newsDesc=$("<div></div>").append(eachNews.NewsContent).text();

				$("#firstNewsImg").attr("src",resultImgUrl);
				$("#firstNewsDate").text(getFormattedDate(eachNews.NewsDate));
				$("#firstNewsTitle").text(SlicingTitle(eachNews.Title));
				$("#firstNewsDesc").text(SlicingDesc(newsDesc));
				$("#firstNewsDetailLink").attr("href",_siteUrl+"/Pages/NewsDetails.aspx?ItemID="+eachNews.ID);
			},function(err){
				console.error(err);
			});
			
		}catch (error) {
			console.error(error);
		}

		for(var i=1;i<_newsCollection.length;i++)
		{
			getImageUrl(_newsCollection[i],i,function(resultImgUrl,eachNews){
				let newsDesc=$("<div></div>").append(eachNews.NewsContent).text();
				var eachNewsContent="<div class='col-lg-4'>"+
													"<a href='"+_siteUrl+"/Pages/NewsDetails.aspx?ItemID="+eachNews.ID+"'>"+
														"<div class='card'>"+
															"<div class='row'>"+
																"<div class='col-5 pr-xs-0 col-lg-12'>"+
																	"<div class='card-img'>"+
																	"<img src='"+resultImgUrl+"' alt='...'>"+
																	"<span class='card-date d-none d-lg-block'>"+getFormattedDate(eachNews.NewsDate)+"</span>"+
																	"</div>"+
																"</div>"+
																"<div class='col-7 col-lg-12'>"+
																	"<div class='card-body'>"+
																		"<span class='card-date d-block d-lg-none'>"+getFormattedDate(eachNews.NewsDate)+"</span>"+
																		"<h5 class='card-title'>"+SlicingTitle(eachNews.Title)+"</h5>"+
																		"<p class='card-text d-none d-lg-block'>"+SlicingDesc(newsDesc)+"</p>"+
																	"</div>"+
																"</div>"+
															"</div>"+
														"</div>"+
													"</a>"+
												"</div>";				
				$("#newsContent").append(eachNewsContent);
			},function(err){
				console.error(err);
			});
		}
	}).fail(CommonUtil.OnRESTError);
}