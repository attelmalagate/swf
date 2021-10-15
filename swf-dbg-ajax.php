 <?php 
	$db_handle  = new SQLite3("D:\\photos\\catalogs\\francois.court - photos\\francois.court - photos.cocatalogdb");
	$sqselall="
	SELECT zimage.zimagefilename as file, zvariant.z_pk AS idvariant, printf('%08d.cot',zvariant.z_pk) AS preview, tmeta.z_pk as iddata,
	tmeta.ZIMAGE_City AS city, tmeta.ZIMAGE_STATE AS state, tmeta.ZIMAGE_COUNTRY AS country, tmeta.ZIMAGE_ISOCOUNTRYCODE AS countrycode ";
	$sqfromwhere="FROM zimage, zvariantmetadata as tmeta, zvariant WHERE zvariant.ZADJUSTMENTLAYER=tmeta.z_pk AND zvariant.zimage=zimage.z_pk";
	$squery=$sqselall . $sqfromwhere . " ORDER BY file asc LIMIT 20";
	$result= $db_handle->query($squery);
	while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
		$jsonArray[] = $row;
	}
	echo json_encode($jsonArray);
 ?> 