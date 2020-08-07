"use strict";
var _siteUrl = "";
var _currentBlog = [];
var _latestBlogcollection = [];
var _currentAttCollection = [];
var _nextBlogCollection = [];
$(document).ready(function () {
	document.title = "Blog Details";
	_siteUrl =_spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', blogStart);
});

function blogStart() {
	setupLanguage();
	// const urlParams = new URLSearchParams(window.location.search);
	const urlParams = new URLSearchParams(window.location.search);
	const itemID = urlParams.get('ItemID')?urlParams.get('ItemID'):urlParams.get('itemid');
	if (itemID != null) {
		var urlForCurrentBlog = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleBlogs + "')/items(" + itemID + ")";
		var get_Current_Blog = SPRestCommon.GetItemAjaxCall(urlForCurrentBlog);

		var urlForCurrentBlogAtt = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleBlogs + "')/items(" + itemID + ")/AttachmentFiles";
		var get_Current_Blog_Attch = SPRestCommon.GetItemAjaxCall(urlForCurrentBlogAtt);

		var urlForNextBlog = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleBlogs + "')/items?"+
							"$select=ID,Title,BlogArabicTitle,ContentDate,BlogContent,BlogContentArabic,IsFeatured1,IsVideo,NoOfViews,Tag,VideoUrl,FieldValuesAsHtml," +
							"ContentWriterName/Title,ContentWriterName/ID,ContentWriterName/StaffArabicTitle,BlogTypeLookup/ID,BlogTypeLookup/Title,BlogTypeLookup/BlogTypeArabic"+
							"&$expand=ContentWriterName,BlogTypeLookup" +
							"&$filter=(ID gt " + itemID + " and BlogTypeLookup/Title eq 'Blog')&$top=1&$orderby=ID asc";
		var get_NextBlog = SPRestCommon.GetItemAjaxCall(urlForNextBlog);

		var urlForLatestBlog = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleBlogs + "')/items?"+
								"$select=ID,Title,BlogArabicTitle,ContentDate,BlogContent,BlogContentArabic,IsFeatured1,IsVideo,NoOfViews,Tag,VideoUrl,FieldValuesAsHtml," +
								"ContentWriterName/Title,ContentWriterName/ID,ContentWriterName/StaffArabicTitle,BlogTypeLookup/ID,BlogTypeLookup/Title,BlogTypeLookup/BlogTypeArabic"+
								"&$expand=ContentWriterName,BlogTypeLookup" +
								"&$filter=(BlogTypeLookup/Title eq 'Blog')&$top=3&$orderby=ContentDate desc";
		var get_LatestBlog = SPRestCommon.GetItemAjaxCall(urlForLatestBlog);
	}

	$.when(get_Current_Blog, get_Current_Blog_Attch, get_NextBlog, get_LatestBlog)
		.then(function (respCurrentBlog, respCurrentAttchments, respNextBlog, respLatestBlog) {
			try {
				_currentBlog = respCurrentBlog[0].d;
				_currentAttCollection = respCurrentAttchments[0].d.results;
				$("#blogTitle,#contentBlogTitle,#carouselBlogTitle").text(isArabic ? _currentBlog.BlogArabicTitle : _currentBlog.Title);
				$("#blogDate,#carouselBlogDate").text(getFormattedDate(_currentBlog.ContentDate));
				$("#currentBlogContent").html(isArabic ? _currentBlog.BlogContentArabic : _currentBlog.BlogContent);

				getImageUrl(_currentBlog, 0, function (resultImgUrl, eachBlog) {
					let sliderPointer = "<li data-target='#post-slider' data-slide-to='0' class='active'></li>";
					let eachBlogContent="";
					if(eachBlog.IsVideo)
						eachBlogContent = "<div class='carousel-item active'>" +
												"<video class='d-block w-100' controls>" +
													"<source src='" + eachBlog.VideoUrl.Url + "' type='video/mp4'>" +
													"Your browser does not support the video tag." +
												"</video>" +
											"</div>";
					else
					 	eachBlogContent = "<div class='carousel-item active'>" +
												"<img src='" + resultImgUrl + "' class='d-block w-100' alt='...'>" +
											"</div>";
					$("#carouselInner").append(eachBlogContent);
					if(_currentAttCollection.length>0)
						$("#carouselIndicator").append(sliderPointer);
				}, function (err) {
					console.error(err);
				});

				if (_currentAttCollection.length > 0) {
					for (let i = 0; i < _currentAttCollection.length; i++) {
						let sliderPointer = "<li data-target='#post-slider' data-slide-to='" + (i + 1) + "'></li>";
						let eachAttachment = _currentAttCollection[i];
						var eachBlogContent = "<div class='carousel-item'>" +
							"<img src='" + eachAttachment.ServerRelativeUrl + "' class='d-block w-100' alt='...'>" +
							"</div>";
						$("#carouselIndicator").append(sliderPointer);
						$("#carouselInner").append(eachBlogContent);
					}
				}
				else
					$("#carouselPrev,#carouselNext").hide();
				
				_nextBlogCollection = respNextBlog[0].d.results;
				if (_nextBlogCollection.length > 0) {
					for (let i = 0; i < _nextBlogCollection.length; i++) {
						let nextBlog = _nextBlogCollection[i];
						$("#nextBlogAnchor").attr("href", _siteUrl + "/Pages/" + (isArabic ? "ar/" : "") + "BlogDetails.aspx?ItemID=" + nextBlog.ID);
						$("#nextBlogAnchor").text(isArabic ? nextBlog.BlogArabicTitle : nextBlog.Title);
					}
				}
				else
					$("#blogNextRead").hide();
			} catch (error) {
				console.error(error);
			}

			try {
				_latestBlogcollection = respLatestBlog[0].d.results;
				for (let i = 0; i < _latestBlogcollection.length; i++) {
					let eachBlog = _latestBlogcollection[i];
					var eachBlogContent = "<div class='related-list-item'>" +
						"<p class='related-date'>" + getFormattedDate(eachBlog.ContentDate) + "</p>" +
						"<a href='" + _siteUrl + "/Pages/" + (isArabic ? "ar/" : "") + "BlogDetails.aspx?ItemID=" + eachBlog.ID + "'>" +
						"<p class='related-title'>" + (isArabic ? eachBlog.BlogArabicTitle : eachBlog.Title) + "</p>" +
						"</a>" +
						"</div>";
					$("#relatedBlog").append(eachBlogContent);
				}
			} catch (error) {
				console.error(error);
			}
		}).fail(CommonUtil.OnRESTError);
}

function setupLanguage(){
	let commonStartUrl=_siteUrl +(isArabic?"/Pages/Ar/":"/Pages/");
	$("#allBlogAnchor").attr("href", commonStartUrl + "Blogs.aspx");

	$("#readNextSectionTitle").text(isArabic?"اقرأ التالي":"Read Next");
	$("#blogWidgetTitle").text(isArabic?"أحدث المدونات":"Latest Blogs");
}