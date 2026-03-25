export default function Spinner({ size = 'md', center = false }) {
  return (
    <div className={center ? 'spinner-center' : ''}>
      <div className={`spinner spinner-${size}`} />
    </div>
  );
}
