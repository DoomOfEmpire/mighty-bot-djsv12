<!DOCTYPE html>
<html>

<head>
    <title>Upload</title>
    <link rel="icon" type="image/x-icon" a href="https://cdn.discordapp.com/attachments/617789215593332840/919307925816770570/mighty.png">
</head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<body>
<style>
body {
  background-image: url('https://cdn.discordapp.com/attachments/617789215593332840/1047583505070170122/1_i1yv42RrOYhvw7U2MM4qCg.gif');
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-size: 100% 100%;
}
.main-title {
    position: absolute;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 50px;
    font-family: 'Brush Script MT', cursive;
    color: white;
}
.info {
  color: white;
  position: absolute;
  bottom: 0;
  left: 0;
  font-family: 'Brush Script MT', cursive;
}
form {
  color: white;
  display: block;
  position: absolute;
  left: 47%;
  top: 50%;    
  transform: translateX(-50%);
}
input[type="submit"],
input[type="file"]::file-selector-button {
  background-color: transparent; /* Green */
  border: 2px solid white;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  -webkit-transition-duration: 0.4s; /* Safari */
  transition-duration: 0.4s;
}

input[type="submit"]:hover,
input[type="file"]::file-selector-button:hover {
  background-color: white; 
  color: black; 
}
</style>
    <form action="upload.php" method="post" enctype="multipart/form-data">
        Select file to upload(Limited to 500MB because of PHP timeouts):
        <input type="file" name="fileToUpload" id="fileToUpload">
        <input type="submit" value="OK" name="submit">
    </form>
    <div class="info">
  Powered and coded with ❤️ by DoomOfEmpire and w3schools - Special thanks to ghosty#1337</a>
</div>
<div class="main-title">mighty-test.go.ro<hr></div>
</body>

</html>
