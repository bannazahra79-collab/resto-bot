const express = require("express")
const axios = require("axios")
const { createClient } = require("@supabase/supabase-js")

const app = express()
app.use(express.json())

const TOKEN = "TOKEN_FONNTE"

// ======================
// SUPABASE
// ======================

const supabase = createClient(
"SUPABASE_URL",
"SUPABASE_KEY"
)


// ======================
// WEBHOOK
// ======================

app.post("/webhook", async (req,res)=>{

const message = req.body.data.message
const sender = req.body.data.sender

console.log("Pesan masuk:", message)

await handleMessage(sender,message)

res.send("ok")

})


// ======================
// HANDLE MESSAGE
// ======================

async function handleMessage(sender,message){

if(message.startsWith("BOOKING#")){

const booking = parseBooking(message)

await saveBooking(sender,booking)

await sendMessage(sender,
"Booking diterima ✅\nAdmin akan segera konfirmasi.")

return
}

const intent = detectIntent(message)

if(intent=="LOKASI"){

await sendMessage(sender,
"Lokasi Resto Banyu Bening:\nhttps://maps.google.com")

}

else if(intent=="BOOKING"){

await sendMessage(sender,
"Baik, untuk booking kirim format:\nBOOKING#tanggal#jam#jumlah#nama")

}

else{

await sendMessage(sender,
"Halo 👋\n\nSilakan pilih:\n1 booking\n2 lokasi\n3 paket rombongan")

}

}


// ======================
// PARSE BOOKING
// ======================

function parseBooking(msg){

const data = msg.split("#")

return {
tanggal: data[1],
jam: data[2],
jumlah: data[3],
nama: data[4]
}

}


// ======================
// SIMPAN BOOKING
// ======================

async function saveBooking(sender,booking){

await supabase
.from("reservations")
.insert([
{
nama: booking.nama,
phone: sender,
tanggal: booking.tanggal,
jam: booking.jam,
jumlah: booking.jumlah,
status: "pending"
}
])

await notifyAdmin(booking,sender)

}


// ======================
// NOTIFIKASI ADMIN
// ======================

async function notifyAdmin(booking,sender){

const admin = "628123456789"

const text = `
BOOKING BARU

Nama: ${booking.nama}
Tanggal: ${booking.tanggal}
Jam: ${booking.jam}
Jumlah: ${booking.jumlah}
WA: ${sender}
`

await sendMessage(admin,text)

}


// ======================
// INTENT PARSER
// ======================

function detectIntent(message){

message = message.toLowerCase()

if(message.includes("lokasi") || message=="2"){
return "LOKASI"
}

if(message.includes("booking") || message=="1"){
return "BOOKING"
}

return "MENU"

}


// ======================
// KIRIM WHATSAPP
// ======================

async function sendMessage(target,message){

try{

await axios.post(
"https://api.fonnte.com/send",
{
target: target,
message: message
},
{
headers:{
Authorization: TOKEN
}
}
)

}catch(err){

console.log("Error kirim pesan:",err.message)

}

}


// ======================
// START SERVER
// ======================

app.listen(3000,()=>{
console.log("Server running on port 3000")
})