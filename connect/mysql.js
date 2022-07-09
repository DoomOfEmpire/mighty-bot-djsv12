const con = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "mmbot"
});
/*con.connect(err => 
{
    if(err) 
    {
        console.log("Database connection failed!");
        process.exit(1);
    }
    else
    {
        console.log(`Database connection successfully!`);
    }
});*/
global.con = con;
