'use client';

import { validatePasswordStrength } from '@/utilities/validation';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  if (!password) return null;

  const strength = validatePasswordStrength(password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-2">
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded ${
              level <= strength.score
                ? strengthColors[strength.score]
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-600">
        Strength: {strengthLabels[strength.score] || 'Very Weak'}
      </p>
      {strength.feedback.length > 0 && (
        <ul className="text-xs text-gray-500 mt-1 list-disc list-inside">
          {strength.feedback.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;

