const BUSINESS_NAME = "Pinnacle Landscaping & Groundworks";

function ukToIntl(n){
  n = n.replace(/\s+/g,"");
  if(n.startsWith("0")) return "44"+n.slice(1);
  if(n.startsWith("+")) return n.slice(1);
  return n;
}

function getBaseUrl(){
  const url = new URL(window.location.href);
  const parts = url.pathname.split("/").filter(Boolean);
  if(parts.length>=1){
    url.pathname="/"+parts[0]+"/";
  }
  url.search="";
  return url.toString();
}

document.getElementById("sendBtn").addEventListener("click",()=>{

  const statement=document.getElementById("statement").value;
  const name=document.getElementById("clientName").value;
  const phone=document.getElementById("clientPhone").value;
  const address=document.getElementById("clientAddress").value;

  if(!statement||!name||!phone||!address){
    alert("Please fill in all fields.");
    return;
  }

  const base=getBaseUrl();
  const link=`${base}sign.html?s=${encodeURIComponent(statement)}&n=${encodeURIComponent(name)}&p=${encodeURIComponent(phone)}&a=${encodeURIComponent(address)}`;

  const message=
`Hi ${name},

Please review the statement using the link below.

1) Sign with your finger and press SUBMIT.
2) SAVE the signed image to your phone.
3) Return to WhatsApp and ATTACH the saved image before sending.

Thank you,
${BUSINESS_NAME}

${link}`;

  const intl=ukToIntl(phone);
  window.open(`https://wa.me/${intl}?text=${encodeURIComponent(message)}`);
});
