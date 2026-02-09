
const Button = ({ btnName, handleClick, classStyles }) => (
    <button
        type="button"
        className={`bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-primary/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${classStyles}`}
        onClick={handleClick}
    >
        {btnName}
    </button>
);

export default Button;
