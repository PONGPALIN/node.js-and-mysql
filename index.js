const express = require("express");
const app = express();
let mysql = require("mysql");
const cookiesSesion = require("cookie-session");
const multer = require("multer");
const upload = multer({ data: 'temp/' });
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");



app.set("view engine", "ejs");
app.set("views", "views");
app.use("/css", express.static(__dirname + "/css"));
app.use("/js", express.static(__dirname + "/js"));
app.use("/property", express.static(__dirname + "/property"));


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function ShowMessage(msg) {
    return `
        <!DOCTYPE html>

        <html lang="en">

        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <title>register</title>
            <link href="/css/login.css" rel="stylesheet" />
            <link href="/css/styles.css" rel="stylesheet" />


        </head>

        <body>
            <h1>${msg}</h1>
            <button  class="btn btn-success" onclick ="window.history.back();" >
                back 
            </button>
        </body>
        </html>`;
}


app.use(cookiesSesion({
    name: 'session',
    keys: ["key1", "key2"],
    maxAge: 26 * 60 * 60 * 100
}));

app.get("/", (req, res) => {
    res.render("property_view", { items: [] })
});

app.get("/search", (req, res) => {
    let conn = mysql.createConnection({ host: "localhost", user: "root", database: "property" });
    let keyword = req.query.keyword || '';
    let sql = `SELECT * FROM w701_test_properties\
    WHERE \`real_estate_name\` LIKE ?
    OR LOCATION\ LIKE?
    `;
    conn.query(sql, ["%" + keyword + "%", "%" + keyword + "%"], function (error, results, fields) {
        if (error) throw error;
        res.render("property_view", { items: results })
    });

});

app.get("/property_detail/:id", (req, res) => {
    let conn = mysql.createConnection({ host: "localhost", user: "root", database: "property" });
    let id = req.params.id || 0;
    let sql = `SELECT * FROM w701_test_properties\
    WHERE id = ?
    `;
    conn.query(sql, [id], function (error, results, fields) {
        if (error) throw error;
        res.render("property_detail", { item: results[0] })
    });

});

app.get("/login", (req, res) => {
    let password_wrong = req.query.password || "";
    if (password_wrong == "wrong")
        password_wrong = true;


    else
        password_wrong = false;

    console.log(password_wrong)
    res.render("login", { password_wrong: password_wrong });

});

app.post("/login", (req, res) => {
    let user = req.body.email || "";
    let pass = req.body.password || "";
    let conn = mysql.createConnection({ host: "localhost", user: "root", database: "property" });
    let sqlCheck = `SELECT * FROM \`users\`
        WHERE email = ? AND password = ?

    `;
    conn.query(sqlCheck, [user, pass], function (error, results, fields) {
        if (error) throw error;
        if (results.length > 0) {

            req.session.username = results[0].name;
            req.session.userrole = results[0].role;
            req.session.email = results[0].email;
            res.redirect("/dashboard");

        } else {
            res.redirect("/login?password=wrong")
        }
        conn.end();
    });
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/");

});


app.get("/register", (req, res) => {
    res.render("register");
});
app.post("/register", (req, res) => {
    let conn = mysql.createConnection({ host: "localhost", user: "root", database: "property" });
    let email = req.body.email || "";
    let password = req.body.password || "";
    let name = req.body.name || "";
    let telephone = req.body.telephone || "";


    let sqlCheck = `SELECT count(*) AS count FROM \`users\`
                    WHERE email = ?

    `;
    conn.query(sqlCheck, [email], function (error, results, fields) {
        if (error) throw error;

        if (results[0].count > 0) {
            res.status(200).send(`
                <!DOCTYPE html>
                <html lang="en">

                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">

                    <title>register</title>
                    <link href="/css/login.css" rel="stylesheet" />
                    <link href="/css/styles.css" rel="stylesheet" />
                    <link href="/css/main.css" rel="stylesheet" />


                </head>

                <body>
                    <h1>username already used </h1>
                    <a href = '/register' class="btn btn-success"> Back</a>
                </body>
                </html>`);
            return;
        }


        let sql = `INSERT INTO \`users\` (email,password,name,telephone,role) 
    VALUES (?,?,?,?,'user')
    
    `;
        conn.query(sql, [email, password, name, telephone], function (error, results, fields) {
            if (error) throw error;
            res.status(200).send(`
        <!DOCTYPE html>

        <html lang="en">

        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <title>register</title>
            <link href="/css/login.css" rel="stylesheet" />
            <link href="/css/styles.css" rel="stylesheet" />


        </head>

        <body>
            <h1>Register sucessful Please login </h1>
            <a href = '/login' class="btn success"> login </a>
        </body>
        </html>`);
        });
        conn.end();
    });
});

app.get("/dashboard", (req, res) => {


    if (req.session.username != undefined) {
        res.render('dashboard/index', { name: req.session.username, role: req.session.userrole });
    } else {
        res.redirect('/login');
    }

});
app.post("/dashboard/user/edit", (req, res) => {


    if (req.session.username != undefined) {
        let conn = mysql.createConnection({ host: "localhost", user: "root", database: "property" });
        let newrole = req.body.newrole || "";
        let id = req.body.id || "";

        let sqlCheck = ``;
        sqlCheck = `UPDATE \`users\`SET\`role\`=? WHERE id = ?`;

        conn.query(sqlCheck, [newrole, id], function (error, results, fields) {
            if (error) throw error;

            res.status(200).send(ShowMessage("แก้ไข User role เรียบร้อยแล้ว"));
            conn.end();
        });
    }
    else {
        res.redirect('/login');
    }

});

app.get("/dashboard/user", (req, res) => {


    if (req.session.username != undefined) {
        let conn = mysql.createConnection({ host: "localhost", user: "root", database: "property" });
        let email = req.session.email || "";

        let sqlCheck = ` `;
        if (req.session.userrole == "admin") {
            sqlCheck = `SELECT * FROM \`users\` ORDER BY id`;
        } else {
            sqlCheck = `SELECT * FROM \`users\` WHERE email = ? ORDER BY id`;
        }
        conn.query(sqlCheck, [email], function (error, results, fields) {
            if (error) throw error;

            res.render('dashboard/user_manage', { users: results });
            conn.end();
        });
    }
    else {
        res.redirect('/login');
    }

});
app.get('/dashboard/property', (req, res) => {
    if (req.session.username != undefined) {
        let conn = mysql.createConnection({ host: "localhost", user: "root", database: "property" });
        let sqlCheck = `SELECT * FROM \`w701_test_properties\` ORDER BY id`;
        console.log(sqlCheck)
        conn.query(sqlCheck, [], function (error, results, fields) {
            if (error) throw error;

            res.render('dashboard/property_manage', { properties: results });
            conn.end();

        });
    } else {
        res.redirect("/login");
    }
});
app.get('/dashboard/property/edit', (req, res) => {
    if (req.session.username != undefined) {
        let conn = mysql.createConnection({ host: "localhost", user: "root", database: "property" });
        let id = req.query.id || "";
        let sqlCheck = `SELECT * FROM \`w701_test_properties\` WHERE id= ? ORDER BY id`;
        console.log(sqlCheck)
        conn.query(sqlCheck, [id], function (error, results, fields) {
            if (error) throw error;

            res.render('dashboard/property_manage_edit', { item: results[0] });
            conn.end();

        });
    } else {
        res.redirect("/login");
    }
});

let filenametoupload = [
    { name: 'image_01', maxCount: 1 },
    { name: 'image_02', maxCount: 1 },
    { name: 'image_03', maxCount: 1 },
    { name: 'image_04', maxCount: 1 },
    { name: 'image_05', maxCount: 1 }
];

app.post('/dashboard/property/edit', upload.fields(), (req, res) => {
    if (req.session.username != undefined) {
        let conn = mysql.createConnection({ host: "localhost", user: "root", database: "property" });



       
        const targetPath = path.join(__dirname, "./property/" + req.files.image_01[0].originalname);

        if (path.extname(req.files.image_01[0].originalname).toLowerCase() === ".png" ||
            path.extname(req.files.image_01[0].originalname).toLowerCase() === ".jpg" ||
            path.extname(req.files.image_01[0].originalname).toLowerCase() === ".jpeg") {
            fs.rename(req.files.image_01[0].originalname, targetPath, err => {
                if (err) return handleError(err, res);

            });
        } else {
            T
            fs.unlink(tempath, err => {
                if (err) return handleError(err, res);

            });
        }



        let id = req.body.id || "";
        let real_estate_name = req.body.real_estate_name || "";
        let lat = req.body.lat || 0;
        let lon = req.body.lon || 0;
        let LOCATION = req.body.LOCATION || "";
        let property_type = req.body.property_type || "";
        let TRANSACTION = req.body.TRANSACTION || "";
        let SALE_TERMS = req.body.SALE_TERMS || "";
        let SALE_PRICE = req.body.SALE_PRICE || 0;
        let RENT_PRICE = req.body.RENT_PRICE || 0;
        let COMMON_CHARGES = req.body.COMMON_CHARGES || "";
        let DECORATION_STYLE = req.body.DECORATION_STYLE || "";
        let BEDROOMS = req.body.BEDROOMS || 0;
        let BATHROOMS = req.body.BATHROOMS || 0;
        let DIRECTION_OF_ROOM = req.body.DIRECTION_OF_ROOM || "";
        let UNIT_SIZE = req.body.UNIT_SIZE || 0;
        let LAND_AREA = req.body.LAND_AREA || 0;
        let INROOM_FACILITIES = req.body.INROOM_FACILITIES || "";
        let PUBLIC_FACILITIES = req.body.PUBLIC_FACILITIES || "";
        let image_01 = targetPath || "";
        // let image_02 = req.body.image_02 || "";
        // let image_03 = req.body.image_03 || "";
        // let image_04 = req.body.image_04 || "";
        // let image_05 = req.body.image_05 || "";
        let sqlCheck = `UPDATE \`w701_test_properties\` SET 
        \`real_estate_name\`=?,
        \`lat\`=?,
        \`lon\`=?,
        \`LOCATION\`=?,
        \`property_type\`=?,
        \`TRANSACTION\`=?,
        \`SALE_TERMS\`=?,
        \`SALE_PRICE\`=?,
        \`RENT_PRICE\`=?,
        \`COMMON_CHARGES\`=?,
        \`DECORATION_STYLE\`=?,
        \`BEDROOMS\`=?,
        \`BATHROOMS\`=?,
        \`DIRECTION_OF_ROOM\`=?,
        \`UNIT_SIZE\`=?,
        \`LAND_AREA\`=?,
        \`INROOM_FACILITIES\`=?,
        \`PUBLIC_FACILITIES\`=?,
        \`image_01\`=?,
        WHERE id =?`;
        console.log(sqlCheck)
        conn.query(sqlCheck, [
            real_estate_name,
            lat,
            lon,
            LOCATION,
            property_type,
            TRANSACTION,
            SALE_TERMS,
            SALE_PRICE,
            RENT_PRICE,
            COMMON_CHARGES,
            DECORATION_STYLE,
            BEDROOMS,
            BATHROOMS,
            DIRECTION_OF_ROOM,
            UNIT_SIZE,
            LAND_AREA,
            INROOM_FACILITIES,
            PUBLIC_FACILITIES,
            image_01,
           

             id], function (error, results, fields) {
                if (error) throw error;

                res.redirect('/dashboard/property',);
                conn.end();

            });
    } else {
        res.redirect("/login");
    }
});



app.listen(3000, () => {
    console.log("app started...");
})