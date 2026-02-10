// Example updated content with ad-blocking functionality logic
const Embed = ({ type, id }) => {
    return (
        <iframe
            src={`https://example.com/embed?type=${type}&id=${id}`}
            width="560"
            height="315"
            sandbox="allow-same-origin allow-scripts"
            referrerpolicy="no-referrer-when-downgrade"
            // Add ad-blocking functionality parameters
            ads="none"
            style={{display: 'block', margin: 'auto', border: 'none'}}
        />
    );
};

export default Embed;