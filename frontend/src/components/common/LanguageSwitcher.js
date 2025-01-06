import React from 'react';
import { ButtonGroup, Button } from 'react-bootstrap';
import { useTranslation } from '../../contexts/LanguageContext';

function LanguageSwitcher({ className }) {
  const { language, setLanguage } = useTranslation();

  return (
    <ButtonGroup size="sm" className={className}>
      <Button 
        variant={language === 'en' ? 'primary' : 'outline-primary'}
        onClick={() => setLanguage('en')}
      >
        EN
      </Button>
      <Button 
        variant={language === 'it' ? 'primary' : 'outline-primary'}
        onClick={() => setLanguage('it')}
      >
        IT
      </Button>
    </ButtonGroup>
  );
}

export default LanguageSwitcher;