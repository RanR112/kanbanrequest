exports.sendNotification = async (user, request, message) => {
    // Kirim email / WhatsApp (Wablas, Chat API, dll)
    console.log(
        `Notify ${user.name} (${user.email}, ${user.no_hp}): ${message}`
    );
};
