// see ../license.txt for licensing
function kfm_changeCaption(id){
	var table=$extend(new Element('table',{
		'id':'kfm_newCaptionDetails'
	}),{kfm_caption_for:id});
	var row=table.insertRow(0),textarea=newInput('kfm_new_caption','textarea',$('kfm_file_icon_'+id).kfm_attributes.caption);
	textarea.setStyles('height:50px;width:200px');
	row.insertCell(0).appendChild(newText(kfm_lang.NewCaption));
	row.insertCell(1).appendChild(textarea);
	kfm_modal_open(table,kfm_lang.ChangeCaption,[[kfm_lang.ChangeCaption,'kfm_changeCaption_set']]);
	$('kfm_new_caption').focus();
}
function kfm_changeCaption_set(){
	var id=$('kfm_newCaptionDetails').kfm_caption_for,newCaption=$('kfm_new_caption').value;
	if(!newCaption||newCaption==$('kfm_file_icon_'+id).kfm_attributes.caption)return;
	kfm_modal_close();
	if(kfm_confirm(kfm_lang.NewCaptionIsThisCorrect(newCaption))){
		kfm_filesCache[id]=null;
		kfm_log(kfm_lang.Log_ChangeCaption(id,newCaption));
		x_kfm_changeCaption(id,newCaption,kfm_refreshFiles);
	}
}
function kfm_img_startLightbox(id){
	if(id&&$type(id)=='array'){
		window.kfm_slideshow={ids:id,at:0};
		id=0;
	}
	if(!id){
		window.kfm_slideshow.at++;
		window.title=window.kfm_slideshow.at;
		id=window.kfm_slideshow.ids[window.kfm_slideshow.at%window.kfm_slideshow.ids.length];
	}
	var el,data=$('kfm_file_icon_'+id).kfm_attributes,ws=getWindowSize(),oldEl=$('kfm_lightboxImage');
	if(!$('kfm_lightboxShader')){
		el=new Element('div',{
			'id':'kfm_lightboxShader',
			'styles':{
				'position':'absolute',
				'left':0,
				'z-index':1,
				'top':0,
				'width':ws.x,
				'height':ws.y,
				'background':'#000',
				'opacity':'.7'
			}
		});
		el.addEvent('click',kfm_img_stopLightbox);
		kfm_addEl(document.body,el);
	}
	if(oldEl)oldEl.remove();
	var w=data.width,h=data.height,url='get.php?id='+id,r=0;
	if(!w||!h){
		kfm_log(kfm_lang.NotAnImageOrImageDimensionsNotReported);
		return kfm_img_stopLightbox();
	}
	if(w>ws.x*.9||h>ws.y*.9){
		if(w>ws.x*.9){
			r=.9*ws.x/w;
			w*=r;
			h*=r;
		}
		if(h>ws.y*0.9){
			r=.9*ws.y/h;
			w*=r;
			h*=r;
		}
		url+='&width='+parseInt(w)+'&height='+parseInt(h);
	}
	el=new Element('img',{
		'id':'kfm_lightboxImage',
		'src':url,
		'styles':{
			'position':'absolute',
			'left':parseInt((ws.x-w)/2),
			'top':parseInt((ws.y-h)/2),
			'z-index':2
		}
	});
	el.addEvent('click',kfm_img_stopLightbox);
	if(window.kfm_slideshow){
		el.addEvent('load',function(){
			setTimeout('kfm_img_startLightbox()',4000);
		});
	}
	kfm_addEl(document.body,el);
}
function kfm_img_stopLightbox(){
	$('kfm_lightboxShader').remove();
	$('kfm_lightboxImage').remove();
	window.kfm_slideshow=null;
}
function kfm_resizeImage(id){
	var data=$('kfm_file_icon_'+id).kfm_attributes;
	var el=kfm_filesCache[id],txt=kfm_lang.CurrentSize(data.width,data.height);
	var x=parseInt(kfm_prompt(txt+kfm_lang.NewWidth,data.width));
	if(!x)return;
	txt+=kfm_lang.NewWidthConfirmTxt(x);
	var y=parseInt(kfm_prompt(txt+kfm_lang.NewHeight,Math.ceil(data.height*(x/data.width))));
	if(!y)return;
	if(kfm_confirm(txt+kfm_lang.NewHeightConfirmTxt(y))){
		kfm_filesCache[id]=null;
		x_kfm_resizeImage(id,x,y,kfm_refreshFiles);
	}
}
function kfm_returnThumbnail(id){
	var size;
	do{
		valid=1;
		size=kfm_prompt(kfm_lang.WhatMaximumSize,'64x64');
		if(!size)return;
		if(!/^[0-9]+x[0-9]+$/.test(size)){
			alert('The size must be in the format XXxYY, where X is the width and Y is the height');
			valid=0;
		}
	}while(!valid);
	var x=size.replace(/x.*/,''),y=size.replace(/.*x/,'');
	x_kfm_getFileUrl(id,x,y,function(url){
		if(kfm_file_handler=='return'||kfm_file_handler=='fckeditor'){
			window.opener.SetUrl(url,0,0,$('kfm_file_icon_'+id).kfm_attributes.caption);
			window.close();
		}
		else if(kfm_file_handler=='download'){
			if(/get.php/.test(url))url+='&forcedownload=1';
			document.location=url;
		}
	});
}
function kfm_rotateImage(id,direction){
	kfm_filesCache[id]=null;
	x_kfm_rotateImage(id,direction,function(id){
		if(id.toString()===id)return kfm_log(id);
		$('kfm_file_icon_'+id).style.backgroundImage='url(get.php?id='+id+'&width=64&height=64&r'+Math.random()+')';
	});
}
