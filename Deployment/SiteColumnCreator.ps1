cls

$SiteURL = "https://soutya.sharepoint.com/sites/Motife/PowershellTest"
$SiteStructureXml = "I:\Workspace\Freelance\Eloqns Salman\Work\QatarProject\Deployment\SiteArchitecture.xml"
$WPDefinationFilePath="I:\Workspace\Freelance\Eloqns Salman\Work\QatarProject\Deployment\WPDefination.xml";
Add-Type -Path "I:\Workspace\UsefullDll\Microsoft.SharePoint.Client.dll"
Add-Type -Path "I:\Workspace\UsefullDll\Microsoft.SharePoint.Client.Runtime.dll"
Add-Type -Path "I:\Workspace\UsefullDll\Microsoft.SharePoint.Client.Publishing.dll"
$UserName = "athar@soutya.onmicrosoft.com"

$ErrorActionPreference = "Stop"
Write-host "Starting Operations"

$Password ="Singapore@123" #Read-Host -Prompt "Enter the password"
$Credentials = New-Object Microsoft.SharePoint.Client.SharePointOnlineCredentials($UserName, (ConvertTo-SecureString $Password -AsPlainText -Force))
#$Credentials = New-Object System.Net.NetworkCredential($UserName, (ConvertTo-SecureString $Password -AsPlainText -Force))
$Ctx = New-Object Microsoft.SharePoint.Client.ClientContext($SiteURL)
$Ctx.Credentials = $Credentials

[XML]$XmlArchitecture = Get-Content $SiteStructureXml
$XmlColumns=$XmlArchitecture.Web.SiteColumns.Field
$XmlContentTypes=$XmlArchitecture.Web.ContentTypes.ContentType
$XmlNormalLists=$XmlArchitecture.Web.Lists.NormalList
$XmlContentTypeLists=$XmlArchitecture.Web.Lists.ContentTypeList
$XmlPublishingPages=$XmlArchitecture.Web.PublishingPages

Function CreateSiteColumns() {
    #Get all Site columns from the site
    $SiteFields = $Ctx.web.Fields
    $Ctx.Load($SiteFields)
    $Ctx.executeQuery()

    foreach($XmlColumn in $XmlColumns){
        $XmlColumnName=$XmlColumn.Name

        Write-host "Processing Site Column $XmlColumnName" -f Yellow

        #Check if the column name exists
        $NewSiteField = $SiteFields | where {$_.InternalName -eq $XmlColumnName}
        if($NewSiteField -ne $NULL) 
        {
            Write-host "Site Column $XmlColumnName already exists!" -f Yellow
        }
        else
        {
            $NewSiteField = $SiteFields.AddFieldAsXml($XmlColumn.OuterXml,$True,[Microsoft.SharePoint.Client.AddFieldOptions]::AddFieldToDefaultView)
            $Ctx.ExecuteQuery()   
            Write-host "Site Column $XmlColumnName Created Successfully!" -ForegroundColor Green 
        }
    }
}

Function CreateContentTypes() {
    #Get all Site columns from the site
    $SiteContentTypes = $Ctx.web.ContentTypes
    $Ctx.Load($SiteContentTypes)
    $Ctx.executeQuery()

    foreach($XmlContentType in $XmlContentTypes){
        $XmlCTypeName=$XmlContentType.Name;
        $XmlCTypeDescription=$XmlContentType.Description;
        $XmlParentCTypeName=$XmlContentType.ParentContentTypeName;
        $XmlCTypeGroup=$XmlContentType.Group;

        Write-host "Processing Content Type $XmlCTypeName"

        #Check if the content type exists
        $NewSiteCType = $SiteContentTypes | where {$_.Name -eq $XmlCTypeName}
        $SiteParentCType = $SiteContentTypes| Where {$_.Name -eq $XmlParentCTypeName}
        if($SiteParentCType -ne $NULL)
        {
            if($NewSiteCType -ne $NULL) 
            {
                Write-host "Content Type $XmlCTypeName already exists!" -f Cyan
            }
            else
            {
                #Specify properties for the new content type
                $CTypeCreationInfo=New-Object Microsoft.SharePoint.Client.ContentTypeCreationInformation
                $CTypeCreationInfo.Name=$XmlCTypeName
                $CTypeCreationInfo.Description=$XmlCTypeDescription
                $CTypeCreationInfo.ParentContentType=$SiteParentCType
                $CTypeCreationInfo.Group=$XmlCTypeGroup
 
                # sharepoint online powershell create content type
                $NewSiteCType=$SiteContentTypes.Add($CTypeCreationInfo)
                $Ctx.ExecuteQuery()
            
                Write-host "Content Type '$XmlCTypeName' Created Successfully!" -ForegroundColor Green
            }

            #Get all fields from content type
            $SiteCTypeFields = $NewSiteCType.Fields
            $Ctx.Load($SiteCTypeFields)
            $Ctx.executeQuery()

            #Get all Site columns from the site
            $SiteFields = $Ctx.web.Fields
            $Ctx.Load($SiteFields)
            $Ctx.executeQuery()

            foreach($XmlCTypeField in $XmlContentType.Field)
            {
                $XmlCtypeFieldName=$XmlCTypeField.Name;

                $FieldExistInSite = $SiteFields | where {$_.InternalName -eq $XmlCtypeFieldName}
                $FieldExistInCType = $SiteCTypeFields | where {$_.InternalName -eq $XmlCtypeFieldName}

                if($FieldExistInSite -ne $NULL) 
                {
                    if($FieldExistInCType -ne $NULL) 
                    {
                       Write-Host "$XmlCTypeName--$XmlCtypeFieldName already exists in content type" -f Cyan                                                                    
                    }
                    else
                    {
                        #Add field to content type
                        $FieldLink = New-Object Microsoft.SharePoint.Client.FieldLinkCreationInformation
                        $FieldLink.Field = $FieldExistInSite
                        [Void]$NewSiteCType.FieldLinks.Add($FieldLink)
                        $NewSiteCType.Update($false)
                        $Ctx.ExecuteQuery()

                        Write-Host "$XmlCTypeName--$XmlCtypeFieldName Added Successfully" -f Green
                    }
                }
                else
                {
                    Write-Host "$XmlCTypeName--$XmlCtypeFieldName not exists in site" -f Red
                }
            }
        }
        else
        {
            Write-host "Parent Content Type $XmlParentCTypeName Not Exist" -f Red
        }
    }
}

Function CreateNormalList() {
    #Get all Site columns from the site
    $SiteLists = $Ctx.web.Lists
    $Ctx.Load($SiteLists)
    $Ctx.executeQuery()

    foreach($XmlNormalList in $XmlNormalLists){
        $XmlListTitle=$XmlNormalList.Name;
        $XmlListDescription=$XmlNormalList.Description;
        $XmlListTemplateID=$XmlNormalList.TemplateID -as [int];

        Write-host "Processing List $XmlListTitle"

        #Check if the list exists
        $NewList = $SiteLists | where {$_.Title -eq $XmlListTitle}
        if($NewList -ne $NULL) 
        {
            Write-host "List $XmlListTitle already exists!" -f Magenta
        }
        else
        {
            #Create list
            $ListCreationInfo = New-Object Microsoft.SharePoint.Client.ListCreationInformation
            $ListCreationInfo.Title = $XmlListTitle
            $ListCreationInfo.TemplateType = $XmlListTemplateID
            $ListCreationInfo.Description = $XmlListDescription
            $NewList = $SiteLists.Add($ListCreationInfo)
            $Ctx.Load($NewList)
            $Ctx.ExecuteQuery()
            
            Write-host "List $XmlListTitle Created Successfully!" -ForegroundColor Green
        }
        #Get all fields from content type
        $NewListFields = $NewList.Fields
        $Ctx.Load($NewListFields)
        $Ctx.executeQuery()

        foreach($XmlListField in $XmlNormalList.Field)
        {
                $XmlListFieldName=$XmlListField.Name;

                $NewSiteField = $NewListFields | where {$_.InternalName -eq $XmlListFieldName}

                    if($NewSiteField -ne $NULL) 
                    {
                       Write-Host "$XmlListTitle--$XmlListFieldName already exists in list" -f Magenta                                                                    
                    }
                    else
                    {
                        $NewSiteField = $NewListFields.AddFieldAsXml($XmlListField.OuterXml,$True,[Microsoft.SharePoint.Client.AddFieldOptions]::AddFieldToDefaultView)
                        $Ctx.ExecuteQuery()   

                        Write-Host "$XmlListTitle--$XmlListFieldName Added Successfully" -f Green
                    }
         }
    }
}

Function CreateContentTypeList() {
    #Get all Site columns from the site
    $SiteLists = $Ctx.web.Lists
    $Ctx.Load($SiteLists)
    $Ctx.executeQuery()

    foreach($XmlContentTypeList in $XmlContentTypeLists){
        $XmlContentTypeListTitle=$XmlContentTypeList.Name;
        $XmlContentTypeListDescription=$XmlContentTypeList.Description;
        $XmlContentTypeListTemplateID=$XmlContentTypeList.TemplateID -as [int];

        Write-host "Processing List $XmlContentTypeListTitle"

        #Check if the list exists
        $NewSiteList = $SiteLists | where {$_.Title -eq $XmlContentTypeListTitle}
        if($NewSiteList -ne $NULL) 
        {
            Write-host "List $XmlContentTypeListTitle already exists!" -f Magenta
        }
        else
        {
            #Create list
            $ListCreationInfo = New-Object Microsoft.SharePoint.Client.ListCreationInformation
            $ListCreationInfo.Title = $XmlContentTypeListTitle
            $ListCreationInfo.TemplateType = $XmlContentTypeListTemplateID
            $ListCreationInfo.Description = $XmlContentTypeListDescription
            $NewSiteList = $SiteLists.Add($ListCreationInfo)
            $Ctx.Load($NewSiteList)
            $Ctx.ExecuteQuery()
            
            Write-host "List $XmlContentTypeListTitle Created Successfully!" -ForegroundColor Green
        }

        if($NewSiteList.ContentTypesEnabled -ne $True)
        {
            $NewSiteList.ContentTypesEnabled = $True
            $NewSiteList.Update()
            $Ctx.ExecuteQuery()
            Write-host "Content Types Enabled in the List!" -f Magenta
        }

        #Get all content types from list
        $NewListContentTypes = $NewSiteList.ContentTypes
        $Ctx.Load($NewListContentTypes)
        $Ctx.executeQuery()

        foreach($ExistingCType in $NewListContentTypes)
        {  
            $ExistingCType.DeleteObject();
            $Ctx.ExecuteQuery()          
        }

        #Get all content types from site
        $SiteContentTypes = $Ctx.web.ContentTypes
        $Ctx.Load($SiteContentTypes)
        $Ctx.executeQuery()

        foreach($XmlListContentType in $XmlContentTypeList.ContentType)
        {
            
            $XmlCTypeName=$XmlListContentType.Name;
            $SiteContentTypeExist = $SiteContentTypes | where {$_.Name -eq $XmlCTypeName}
            #$ListContentTypeExist = $NewListContentTypes | where {$_.Name -eq $XmlCTypeName}
            if($SiteContentTypeExist -ne $NULL) 
            {
                
                #if($ListContentTypeExist -ne $NULL) 
                #{
                #   Write-host "$XmlContentTypeListTitle--$XmlCTypeName already exists in List!" -f Magenta
                #}
                #else
                #{
                    $AddedCtype = $NewListContentTypes.AddExistingContentType($SiteContentTypeExist)
                    $Ctx.ExecuteQuery()

                    Write-host "$XmlContentTypeListTitle--$XmlCTypeName added successfully" -f Green
                #}
            }
            else
            {
                Write-host "Content Type $XmlCTypeName does not exists at site!" -f Magenta
            }
        }
    }
}

Function CreatePublishingPages() {
    
    $XmlLayoutName=$XmlPublishingPages.LayoutName
    $XmlComment=$XmlPublishingPages.CheckedInComment

    if($XmlLayoutName -ne $NULL)
    {
        #Get all Site columns from the site
        $MasterPageList = $Ctx.Site.RootWeb.Lists.GetByTitle('Master Page Gallery')
        $PagesList =$Ctx.web.Lists.GetByTitle('Pages')
        $CAMLQuery = New-Object Microsoft.SharePoint.Client.CamlQuery
        $CAMLQuery.ViewXml = "<View><Query><Where><Eq><FieldRef Name='FileLeafRef' /><Value Type='Text'>$XmlLayoutName</Value></Eq></Where></Query></View>"
        $PageLayoutItems = $MasterPageList.GetItems($CAMLQuery)
        $Ctx.Load($PageLayoutItems)
        $Ctx.Load($PagesList)
        $Ctx.ExecuteQuery()
        if($PageLayoutItems.Count -eq 0)
        {
            Write-host "$XmlLayoutName Layout not found" -f Red
        }
        else
        {
            $PageLayoutItem = $PageLayoutItems[0]
            #$Ctx.Load($PageLayoutItem)
            #$Ctx.ExecuteQuery()

            #Get the publishing Web 
            $PublishingWeb = [Microsoft.SharePoint.Client.Publishing.PublishingWeb]::GetPublishingWeb($Ctx, $Ctx.Web) 
            $Ctx.Load($PublishingWeb)
            $Ctx.ExecuteQuery()
            foreach($XmlPublishingPage in $XmlPublishingPages.PublishingPage)
            {
                $XmlPublishingPageName=$XmlPublishingPage.Name;
                $XmlPublishingPageHtmlPath=$XmlPublishingPage.HtmlPath;

                Write-host "Processing Page $XmlPublishingPageName" -f DarkYellow

                $PagesListQuery = New-Object Microsoft.SharePoint.Client.CamlQuery  
                $PagesListQuery.ViewXml = "<View><Query><Where><Contains><FieldRef Name='FileLeafRef' /><Value Type='Text'>"+$XmlPublishingPageName+"</Value></Contains></Where></Query></View>" 
                $PagesListItems = $PagesList.GetItems($PagesListQuery)  

                $Ctx.load($PagesListItems)      
                $Ctx.executeQuery()   

                if($PagesListItems.Count -eq 0)
                {      
                    #Create Publishing page
                    $PageInfo = New-Object Microsoft.SharePoint.Client.Publishing.PublishingPageInformation 
                    $PageInfo.Name = $XmlPublishingPageName
                    $PageInfo.PageLayoutListItem = $PageLayoutItem
                    $Page = $PublishingWeb.AddPublishingPage($PageInfo) 
                    $Ctx.ExecuteQuery()

                    #Get the List item of the page
                    $ListItem = $Page.ListItem
                    $Ctx.Load($ListItem)
                    $Ctx.ExecuteQuery()
 
                    #Update Page Contents
                    $ListItem["Title"] = $XmlPublishingPageName
                    $ListItem.Update()
                    $Ctx.ExecuteQuery()

                    #Publish the page
                    $PageFile=$ListItem.File;
                    $PageFile.CheckIn("$XmlComment", [Microsoft.SharePoint.Client.CheckinType]::MajorCheckIn)
                    $PageFile.Publish("$XmlComment");
                    $Ctx.Load($PageFile);
                    $Ctx.ExecuteQuery()

                    Write-host "$XmlPublishingPageName Created Successfully" -f Green
                }
                else
                {
                   $PageFile= $PagesListItems[0].File;
                   $Ctx.Load($PageFile);
                   $Ctx.ExecuteQuery();
                }  
                   # Get all the webparts 
                   Write-Host "Retrieving webparts" 
                   $wpManager = $PageFile.GetLimitedWebPartManager([Microsoft.SharePoint.Client.WebParts.PersonalizationScope]::Shared)  
                   $webparts = $wpManager.Webparts  
                   $Ctx.Load($webparts)  
                   $Ctx.ExecuteQuery()   
                   
                    $newwpTitle = "Content Editor" 
                    $wpExists = $false 
                    if($webparts.Count -gt 0)
                    {      
                        Write-Host "Looping through all webparts"     
                        foreach($webpart in $webparts)
                        {   $Ctx.Load($webpart) 
                            $Ctx.ExecuteQuery()
                            if($webpart.WebPart.Title -eq $newwpTitle)
                            {              
                                Write-Host "Webpart present"             
                                $wpExists = $true         
                            }
                        }  
                    }  

                    if(!$wpExists)
                    {      
                        #Check if page already checked out. If so, undo check out 
                        if($PageFile.CheckOutType -eq [Microsoft.SharePoint.Client.CheckOutType]::Online)
                        {   
                            try
                            {          
                                Write-Host "Undo Checkout"         
                                $PageFile.UndoCheckOut()          
                                $Ctx.load($PageFile)          
                                $Ctx.ExecuteQuery()                  
                            }   
                            catch
                            {          
                                write-host "Error in checkout.. $($_.Exception.Message)" -foregroundcolor red      
                            }
                         }   

                        #If page is not checked out, then check out 
                        if($PageFile.CheckOutType -eq [Microsoft.SharePoint.Client.CheckOutType]::None)
                        {      
                            Write-Host "Checkout"     
                            $PageFile.CheckOut()      
                            $Ctx.Load($PageFile)      
                            $Ctx.ExecuteQuery()  
                        } 

                        Write-Host "Adding webpart" 
                        $WPXmlFile =[xml] (Get-Content -Path "$WPDefinationFilePath")
                        $WPXmlFile.SelectNodes("//*[local-name()='ContentLink']") | % { 
                            $_."#text" = "$XmlPublishingPageHtmlPath" 
                            }
                        $WPXmlFile.Save("$WPDefinationFilePath")
                        $XmlDocument=Get-Content -Path "$WPDefinationFilePath"
                        $importWP = $wpManager.ImportWebPart($XmlDocument)  
                        $wpManager.AddWebPart($importWP.WebPart,0,0)  
                        #$ctx.ExecuteQuery()  
                        Write-Host "Page checkin" 
                        $PageFile.CheckIn("Added webpart", [Microsoft.SharePoint.Client.CheckinType]::MajorCheckIn)  
                        $Ctx.load($PageFile)  
                        $Ctx.ExecuteQuery()  
                    } 
            }
        }
    }
    else
    {
        Write-host "Layout Name in XML is empty" -f Red
    }
    
}

#CreateSiteColumns
#CreateContentTypes
#CreateNormalList
#CreateContentTypeList
CreatePublishingPages

Write-host "Operations Ended"