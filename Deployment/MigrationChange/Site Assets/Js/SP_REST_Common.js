var SPRestCommon = SPRestCommon || {};

SPRestCommon.getItemTypeForListName = function(listName)
{
	return "SP.Data." + listName.charAt(0).toUpperCase() + listName.slice(1) + "ListItem";
};

SPRestCommon.getListItems = function(urlForItems, successCallback, errorCallback)
{
	$.ajax(
	{
		url: urlForItems,
		type: "GET",
		headers: 
		{
			"Accept": "application/json;odata=verbose",
		},
		success: successCallback,
		error: errorCallback
	});
};

SPRestCommon.bindSiteColumn = function(listName, ddlId, siteColumnName, firstText)
{
	if(firstText === undefined || firstText === null ){
		firstText = "< Select >";
	}
	$.ajax(
	{
		url: _spPageContextInfo.webAbsoluteUrl +"/_api/web/lists/GetByTitle('" + listName + "')/fields?$filter=EntityPropertyName eq '" + siteColumnName + "'",
        type: "GET",
        headers: { "Accept": "application/json;odata=verbose", },
		
		success: function (data) 
		{
			$("#" + ddlId).append($("<option></option>").val('0').html(firstText)); 
			//console.log(data.d.results[0].Choices.results);

			var data_choice = data.d.results[0].Choices.results;
			
			for(i=0; i<data_choice.length; i++)
			{
				$("#" + ddlId).append($("<option></option>").val(data_choice[i]).html(data_choice[i]));
			}
		},
		
		error: function (error) 
		{
            console.log(JSON.stringify(error));
        }
	});
};

SPRestCommon.getChoiceColValues = function(listTitle, siteColumnName)
{
	return $.ajax(
	{
		url: _spPageContextInfo.webAbsoluteUrl +"/_api/web/lists/GetByTitle('" + listTitle + "')/fields?$filter=EntityPropertyName eq '" + siteColumnName + "'",
        type: "GET",
        headers: { "Accept": "application/json;odata=verbose", }
	});
};

SPRestCommon.getAllListItems = function(urlForAllItems) // , successCallback, errorCallback)
{
	var deferred = $.Deferred();
	var response = response || [];
	
	function getListItemsRecursively()
	{
		$.ajax(
		{
			url: urlForAllItems,
			type: "GET",
			headers: 
			{
				"Accept": "application/json;odata=verbose",
			},
			success: function(data)
			{
				response = response.concat(data.d.results);
				if(data.d.__next)
				{
					urlForAllItems = data.d.__next;
					getListItemsRecursively();
				}
				else{
					deferred.resolve(response);
				}
			},
			error: function(err){
				deferred.reject(err);
			},
		});
	};

	getListItemsRecursively();
	
	return deferred.promise();
};

SPRestCommon.getItemAddingHeader = function()
{
	var header = {
		"Accept": "application/json;odata=verbose",
		"Content-Type": "application/json;odata=verbose",
		"X-RequestDigest": $("#__REQUESTDIGEST").val()
	};
	
	return header;
}

SPRestCommon.addListItem = function(allItemsUrl, listName, itemProperties, successCallback, errorCallback)
{
	var pay_load = {
		"__metadata": {"type": SPRestCommon.getItemTypeForListName(listName)}
	};
	
	for(var prop in itemProperties)
	{
		pay_load[prop] = itemProperties[prop];
	}
	
	$.ajax
	(
		{
			url: allItemsUrl,
			type: "POST",
			headers: SPRestCommon.getItemAddingHeader(),
			data: JSON.stringify(pay_load),
			success: successCallback,
			error: errorCallback
		}
	);
};

SPRestCommon.getItemUpdatingHeader = function(oldItem)
{
	var etag = (oldItem == null || oldItem == undefined) ? "*" : oldItem.__metadata.etag;
	var header = {
		"Accept": "application/json;odata=verbose",
		"Content-Type": "application/json;odata=verbose",
		"X-RequestDigest": $("#__REQUESTDIGEST").val(),
		"X-HTTP-Method": "PATCH",
		"If-Match": etag
	};
	
	return header;
}

SPRestCommon.updateListItem = function(listItemUrl, listName, itemProperties, successCallback, errorCallback, oldItem)
{
	var pay_load = {
		"__metadata": {"type": SPRestCommon.getItemTypeForListName(listName)}
	};
	
	for(var prop in itemProperties)
	{
		pay_load[prop] = itemProperties[prop];
	}
	
	$.ajax
	(
		{
			url: listItemUrl,
			type: "POST",
			headers: SPRestCommon.getItemUpdatingHeader(oldItem),
			data: JSON.stringify(pay_load),
			success: successCallback,
			error: errorCallback
		}
	);
};

SPRestCommon.updateFileListItem = function(listItemUrl, listName, itemProperties, successCallback, errorCallback, oldItem)
{
	var pay_load = {
		"__metadata": {"type": oldItem.__metadata.type}
	};
	
	for(var prop in itemProperties)
	{
		pay_load[prop] = itemProperties[prop];
	}
	
	$.ajax
	(
		{
			url: listItemUrl,
			type: "POST",
			headers: SPRestCommon.getItemUpdatingHeader(oldItem),
			data: JSON.stringify(pay_load),
			success: successCallback,
			error: errorCallback
		}
	);
};

SPRestCommon.getItemDeletingHeader = function(oldItem)
{
	var etag = (oldItem == undefined || oldItem == null) ? "*" : oldItem.__metadata.etag;
	var header = {
		"Accept": "application/json;odata=verbose",
		"Content-Type": "application/json;odata=verbose",
		"X-RequestDigest": $("#__REQUESTDIGEST").val(),
		"X-HTTP-Method": "DELETE",
		"If-Match": etag
	};
	
	return header;
}

SPRestCommon.deleteListItem = function(listItemUrl, successCallback, errorCallback, oldItem)
{
	$.ajax(
	{
		url: listItemUrl,
		type: "DELETE",
		headers: SPRestCommon.getItemDeletingHeader(oldItem),
		success: successCallback,
		error: errorCallback
	});
};

SPRestCommon.getFormDigest = function (webUrl) {
    return $.ajax({
        url: webUrl + "/_api/contextinfo",
        method: "POST",
        headers: { "Accept": "application/json; odata=verbose" }
    });
}

// Get the local file as an array buffer.
SPRestCommon.getFileBuffer = function(fileInputId) {
	var deferred = jQuery.Deferred();
	var reader = new FileReader();
	reader.onloadend = function (e) {
		deferred.resolve(e.target.result);
	}
	reader.onerror = function (e) {
		deferred.reject(e.target.error);
	}
	reader.readAsArrayBuffer($("#" + fileInputId)[0].files[0]);
	return deferred.promise();
}

// Add the file to the file collection in the Shared Documents folder.
SPRestCommon.addFileToFolder = function (arrayBuffer, fileInputId, serverUrl, serverRelativeUrlToFolder) {
	// Get the file name from the file input control on the page.
	var parts = $("#" + fileInputId)[0].value.split('\\');
	var fileName = parts[parts.length - 1];
	var date_time_part = moment().format("YYYYMMDD_HHmmss");
	var dot_index = fileName.lastIndexOf(".");
	var new_file_name = fileName.substring(0, dot_index) + "_" + date_time_part + fileName.substring(dot_index);

	// Construct the endpoint.
	var fileCollectionEndpoint = String.format(
		"{0}/_api/web/getfolderbyserverrelativeurl('{1}')/files" +
		"/add(overwrite=true, url='{2}')",
		serverUrl, serverRelativeUrlToFolder, new_file_name);

	// Send the request and return the response.
	// This call returns the SharePoint file.
	return jQuery.ajax({
		url: fileCollectionEndpoint,
		type: "POST",
		data: arrayBuffer,
		processData: false,
		headers: {
			"accept": "application/json;odata=verbose",
			"X-RequestDigest": jQuery("#__REQUESTDIGEST").val(),
			"content-length": arrayBuffer.byteLength
		}
	});
}

// Get the list item that corresponds to the file by calling the file's ListItemAllFields property.
SPRestCommon.getListItemByFileListItemUri = function(fileListItemUri) {
    // Send the request and return the response.
    return jQuery.ajax({
      url: fileListItemUri,
      type: "GET",
      headers: { "accept": "application/json;odata=verbose" }
    });
  }

SPRestCommon.GetItemAjaxCall = function (urlForItems) {
	return $.ajax(
		{
			url: urlForItems,
			type: "GET",
			headers:
			{
				"Accept": "application/json;odata=verbose",
			}
		});
}

SPRestCommon.GetAddListItemAjaxCall = function(allItemsUrl, listName, itemProperties)
{
	var pay_load = {
		"__metadata": {"type": SPRestCommon.getItemTypeForListName(listName)}
	};
	
	for(var prop in itemProperties)
	{
		pay_load[prop] = itemProperties[prop];
	}
	
	return $.ajax
	(
		{
			url: allItemsUrl,
			type: "POST",
			headers: SPRestCommon.getItemAddingHeader(),
			data: JSON.stringify(pay_load),
		}
	);
};

SPRestCommon.GetUpdateListItemAjaxCall = function(listItemUrl, listName, itemProperties, oldItem)
{
	var pay_load = {
		"__metadata": {"type": SPRestCommon.getItemTypeForListName(listName)}
	};
	
	for(var prop in itemProperties)
	{
		pay_load[prop] = itemProperties[prop];
	}
	
	return $.ajax
	(
		{
			url: listItemUrl,
			type: "POST",
			headers: SPRestCommon.getItemUpdatingHeader(oldItem),
			data: JSON.stringify(pay_load),
		}
	);
};

SPRestCommon.GetDeleteListItemAjaxCall = function(listItemUrl, oldItem)
{
	return $.ajax(
	{
		url: listItemUrl,
		type: "DELETE",
		headers: SPRestCommon.getItemDeletingHeader(oldItem),
	});
};

SPRestCommon.GetPeoplePickerUser = function (peoplepickerId) {
	var deferred = $.Deferred();
	var peoplePicker = SPClientPeoplePicker.SPClientPeoplePickerDict[peoplepickerId + "_TopSpan"];
	// Get information about all users.
	var users = peoplePicker.GetAllUserInfo();

	var payload = { 'logonName': users[0].Key };
	$.ajax({
		url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/ensureuser",
		type: "POST",
		contentType: "application/json;odata=verbose",
		data: JSON.stringify(payload),
		headers: {
			"X-RequestDigest": $("#__REQUESTDIGEST").val(),
			"accept": "application/json;odata=verbose"
		},
		success: function (user) {
			deferred.resolve(user.d);
		},
		error: function (err) {
			deferred.reject(err);
		}
	});

	return deferred.promise();
}