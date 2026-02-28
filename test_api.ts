async function main() {
    const licenseKey = "BARMAGLY-39D4-EDB2-3D44-DD98";
    const email = "info@pizzalemon.ch";
    const password = "password123";

    const res = await fetch("http://localhost:5001/api/license/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            licenseKey,
            email,
            password,
            deviceId: "test-device"
        })
    });

    const data = await res.json();
    console.log("Validation Response on 5001:", data);
}

main().catch(console.error);
