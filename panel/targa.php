<?php
$user_agent     =   $_SERVER['HTTP_USER_AGENT'];
// Getting OS Name
function getOS() { 

    global $user_agent;

    $os_platform    =   "Unknown OS Platform";

    $os_array       =   array(
                            '/windows nt 10/i'     =>  'Windows 10',
                            '/windows nt 6.3/i'     =>  'Windows 8.1',
                            '/windows nt 6.2/i'     =>  'Windows 8',
                            '/windows nt 6.1/i'     =>  'Windows 7',
                            '/windows nt 6.0/i'     =>  'Windows Vista',
                            '/windows nt 5.2/i'     =>  'Windows Server 2003/XP x64',
                            '/windows nt 5.1/i'     =>  'Windows XP',
                            '/windows xp/i'         =>  'Windows XP',
                            '/windows nt 5.0/i'     =>  'Windows 2000',
                            '/windows me/i'         =>  'Windows ME',
                            '/win98/i'              =>  'Windows 98',
                            '/win95/i'              =>  'Windows 95',
                            '/win16/i'              =>  'Windows 3.11',
                            '/macintosh|mac os x/i' =>  'Mac OS X',
                            '/mac_powerpc/i'        =>  'Mac OS 9',
                            '/linux/i'              =>  'Linux',
							'/kalilinux/i'          =>  'KaliLinux',
                            '/ubuntu/i'             =>  'Ubuntu',
                            '/iphone/i'             =>  'iPhone',
                            '/ipod/i'               =>  'iPod',
                            '/ipad/i'               =>  'iPad',
                            '/android/i'            =>  'Android',
                            '/blackberry/i'         =>  'BlackBerry',
                            '/webos/i'              =>  'Mobile',
							'/Windows Phone/i'      =>  'Windows Phone'
                        );

    foreach ($os_array as $regex => $value) { 

        if (preg_match($regex, $user_agent)) {
            $os_platform    =   $value;
        }

    }   

    return $os_platform;

}
// END of Getting OS
//
// Get browser
function getBrowser() {

    global $user_agent;

    $browser        =   "Unknown Browser";

    $browser_array  =   array(
                            '/msie/i'       =>  'Internet Explorer',
                            '/firefox/i'    =>  'Firefox',
							'/Mozilla/i'	=>	'Mozila',
							'/Mozilla/5.0/i'=>	'Mozila',
                            '/safari/i'     =>  'Safari',
                            '/chrome/i'     =>  'Chrome',
                            '/edge/i'       =>  'Edge',
                            '/opera/i'      =>  'Opera',
							'/OPR/i'        =>  'Opera',
                            '/netscape/i'   =>  'Netscape',
                            '/maxthon/i'    =>  'Maxthon',
                            '/konqueror/i'  =>  'Konqueror',
							'/Bot/i'		=>	'BOT Browser',
							'/Valve Steam GameOverlay/i'  =>  'Steam',
                            '/mobile/i'     =>  'Handheld Browser'
                        );

    foreach ($browser_array as $regex => $value) { 

        if (preg_match($regex, $user_agent)) {
            $browser    =   $value;
        }

    }

    return $browser;

}
// END of getting browser
function getIP() 
{ 
	if (isset($_SERVER)) 
	{ 
		if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) 
		{ 
			$realip = $_SERVER['HTTP_X_FORWARDED_FOR']; 
		} 
		else {
			if (isset($_SERVER['HTTP_CLIENT_IP'])) 
			{ 
				$realip = $_SERVER['HTTP_CLIENT_IP']; 
			} 
			else 
			{ 
				$realip = $_SERVER['REMOTE_ADDR']; 
			} 
		} 
	}
	else {
		if (getenv("HTTP_X_FORWARDED_FOR")) 
		{ 
			$realip = getenv( "HTTP_X_FORWARDED_FOR"); 
		} 
		else {
			if (getenv("HTTP_CLIENT_IP")) 
			{ 
				$realip = getenv("HTTP_CLIENT_IP"); 
			}
			else
			{ 
				$realip = getenv("REMOTE_ADDR"); 
			} 
		}
	}
	return $realip; 
}
$user_os        =   getOS();
$user_browser   =   getBrowser();
$ip = getIP();
$site_refer = $_SERVER['HTTP_REFERER'];
if($site_refer == ""){
	$site = "direct connection";
}

else {
	$site = $site_refer;
}

$owner = "HIDE THIS IP ADDRESS";   //Change $owner for something else, cuz someone can simple read that by calling out $owner

$owner_country = "YOUR COUNTRY TAG FOR YOUR IP ↑"; //This u can leave how it is.

if($ip == $owner){ //Change it here 
	$ip = "Owner"; 
	$country = $owner_country;
}
else {
	$details = json_decode(file_get_contents("http://ipinfo.io/{$ip}"));
	$country = $details->country;
}

// Writing in to txt file
//$myfile = file_put_contents('iplist.txt',date("Y-m-d - H:i:s - "). $country. " ". $ip." | ". $user_os. " | ". $user_browser. " | From: ". $site. " | user agent:" .$user_agent .PHP_EOL , FILE_APPEND | LOCK_EX);
//fclose($myfile);

$file = 'iplist-54-233-2544.txt';
// Open the file to get existing content
$current = file_get_contents($file);
// Append a new person to the file
$current .= date("Y-m-d - H:i:s - "). $country. " ". $ip." | ". $user_os. " | ". $user_browser. " | From: ". $site. " | user agent:" .$user_agent . "\n";
// Write the contents back to the file
file_put_contents($file, $current);
