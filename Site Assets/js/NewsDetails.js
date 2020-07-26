"use strict";
var _siteUrl = "";
var _currentNews = [];
var _latestNewscollection = [];
var _latestBlogscollection = [];
var _currentAttCollection = [];
var _nextNewsCollection = [];
$(document).ready(function () {
	document.title = "News Details";
	_siteUrl = _spPageContextInfo.webAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', newsStart);
});

function newsStart() {
	const urlParams = new URLSearchParams(window.location.search);
	const itemID = urlParams.get('ItemID');
	if (itemID != null) {
		var urlForCurrentNews = _siteUrl + "/_api/web/lists/GetByTitle('"+_listTitleNews+"')/items(" + itemID + ")";
		var get_Current_News = SPRestCommon.GetItemAjaxCall(urlForCurrentNews);

		var urlForCurrentNewsAtt = _siteUrl + "/_api/web/lists/GetByTitle('"+_listTitleNews+"')/items(" + itemID + ")/AttachmentFiles";
		var get_Current_News_Attch = SPRestCommon.GetItemAjaxCall(urlForCurrentNewsAtt);

		var urlForNextNews = _siteUrl + "/_api/web/lists/GetByTitle('"+_listTitleNews+"')/items?$filter=ID gt "+itemID+"&$top=1&$orderby=ID asc";
		var get_NextNews = SPRestCommon.GetItemAjaxCall(urlForNextNews);

		var urlForLatestNews = _siteUrl + "/_api/web/lists/GetByTitle('"+_listTitleNews+"')/items?$top=3&$orderby=NewsDate desc";
		var get_LatestNews = SPRestCommon.GetItemAjaxCall(urlForLatestNews);

		var urlForLatestBlogs = _siteUrl + "/_api/web/lists/GetByTitle('"+_listTitleBlogs+"')/items?$filter=(BlogType eq 'Blog')&$top=3&$orderby=ContentDate desc";
		var get_LatestBlogs = SPRestCommon.GetItemAjaxCall(urlForLatestBlogs);
	}

	$.when(get_Current_News, get_LatestNews, get_LatestBlogs, get_Current_News_Attch,get_NextNews)
		.then(function (respCurrentNews, respLatestNews, respLatestBlogs, respCurrentAttchments,respNextNews) {
			try {
				_currentNews = respCurrentNews[0].d;
				$("#newsTitle,#contentNewsTitle,#carouselNewsTitle").text(_currentNews.Title);
				$("#newsDate,#carouselNewsDate").text(getFormattedDate(_currentNews.NewsDate));
				let newsDesc=$("<div></div>").append(_currentNews.NewsContent);
				$("#currentNewsContent").html(newsDesc);

				getImageUrl(_currentNews, 0, function (resultImgUrl, eachNews) {
					let sliderPointer = "<li data-target='#post-slider' data-slide-to='0' class='active'></li>";
					var eachNewsContent = "<div class='carousel-item active'>" +
						"<img src='" + resultImgUrl + "' class='d-block w-100' alt='...'>" +
						"</div>";
					$("#carouselIndicator").append(sliderPointer);
					$("#carouselInner").append(eachNewsContent);
				}, function (err) {
					console.error(err);
				});

				_latestNewscollection = respLatestNews[0].d.results;
				for (let i = 0; i < _latestNewscollection.length; i++) {
					let eachNews = _latestNewscollection[i];
					var eachNewsContent = "<div class='related-list-item'>" +
						"<p class='related-date'>" + getFormattedDate(eachNews.NewsDate) + "</p>" +
						"<a href='"+_siteUrl+"/Pages/NewsDetails.aspx?ItemID="+eachNews.ID+"'>" +
						"<p class='related-title'>" + eachNews.Title + "</p>" +
						"</a>" +
						"</div>";
					$("#relatedNews").append(eachNewsContent);
				}

				_latestBlogscollection = respLatestBlogs[0].d.results;
				for (let i = 0; i < _latestBlogscollection.length; i++) {
					let eachBlog = _latestBlogscollection[i];
					var eachBlogContent = "<div class='related-list-item'>" +
						"<p class='related-date'>" + getFormattedDate(eachBlog.ContentDate) + "</p>" +
						"<a href='"+_siteUrl+"/Pages/BlogDetails.aspx?ItemID="+eachBlog.ID+"'>" +
						"<p class='related-title'>" + eachBlog.Title + "</p>" +
						"</a>" +
						"</div>";
					$("#relatedBlogs").append(eachBlogContent);
				}

				_currentAttCollection = respCurrentAttchments[0].d.results;
				if(_currentAttCollection.length>0){
					for (let i = 0; i < _currentAttCollection.length; i++) {
						let sliderPointer = "<li data-target='#post-slider' data-slide-to='" + (i+1) + "'></li>";
						let eachAttachment = _currentAttCollection[i];
						var eachNewsContent = "<div class='carousel-item'>" +
													"<img src='" + eachAttachment.ServerRelativeUrl + "' class='d-block w-100' alt='...'>" +
												"</div>";
						$("#carouselIndicator").append(sliderPointer);
						$("#carouselInner").append(eachNewsContent);
					}
				}
				else
					$("#carouselPrev,#carouselNext").hide();

				_nextNewsCollection = respNextNews[0].d.results;
				if(_nextNewsCollection.length>0)
				{
					for (let i = 0; i < _nextNewsCollection.length; i++) {
						let nextNews = _nextNewsCollection[i];
						$("#nextNewsAnchor").attr("href",_siteUrl+"/Pages/NewsDetails.aspx?ItemID="+nextNews.ID);
						$("#nextNewsAnchor").text(nextNews.Title);
					}
				}
				else{
					$("#newsNextRead").hide();
				}
			} catch (error) {
				console.error(error);
			}
		}).fail(CommonUtil.OnRESTError);
}