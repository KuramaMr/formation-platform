'use client';

import { useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Signature {
  id: string;
  userId: string;
  userName: string;
  formationId: string;
  formationTitre: string;
  signatureData: string;
  createdAt: Timestamp;
  date?: string; // Date au format YYYY-MM-DD pour faciliter le regroupement
}

export default function useSignatures() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les signatures pour une formation
  const getSignaturesByFormation = async (formationId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Recherche des signatures pour la formation:", formationId);
      
      const signaturesRef = collection(db, 'signatures');
      const q = query(
        signaturesRef,
        where('formationId', '==', formationId),
        orderBy('createdAt', 'desc')
      );
      
      try {
        const querySnapshot = await getDocs(q);
        console.log("Nombre de signatures trouvées:", querySnapshot.size);
        
        const signatures: Signature[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt as Timestamp;
          
          // Ajouter une propriété date au format YYYY-MM-DD pour faciliter le regroupement
          const dateObj = createdAt.toDate();
          const date = dateObj.toISOString().split('T')[0]; // Format YYYY-MM-DD
          
          signatures.push({
            id: doc.id,
            ...data,
            date
          } as Signature);
        });
        
        return signatures;
      } catch (indexError: any) {
        console.error("Erreur d'index:", indexError.message);
        
        // Utiliser la requête sans orderBy comme solution de secours
        const qWithoutOrder = query(
          signaturesRef,
          where('formationId', '==', formationId)
        );
        
        const fallbackSnapshot = await getDocs(qWithoutOrder);
        console.log("Nombre de signatures trouvées (sans tri):", fallbackSnapshot.size);
        
        const signatures: Signature[] = [];
        fallbackSnapshot.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt as Timestamp;
          
          // Ajouter une propriété date au format YYYY-MM-DD
          const dateObj = createdAt.toDate();
          const date = dateObj.toISOString().split('T')[0]; // Format YYYY-MM-DD
          
          signatures.push({
            id: doc.id,
            ...data,
            date
          } as Signature);
        });
        
        // Tri manuel par date (du plus récent au plus ancien)
        signatures.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        
        return signatures;
      }
    } catch (error: any) {
      console.error("Erreur lors de la récupération des signatures:", error);
      setError(error.message || 'Une erreur est survenue lors de la récupération des signatures');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Regrouper les signatures par jour
  const getSignaturesByDay = async (formationId: string) => {
    const signatures = await getSignaturesByFormation(formationId);
    
    // Regrouper les signatures par jour
    const signaturesByDay: { [date: string]: Signature[] } = {};
    
    signatures.forEach(signature => {
      if (!signature.date) return;
      
      if (!signaturesByDay[signature.date]) {
        signaturesByDay[signature.date] = [];
      }
      
      signaturesByDay[signature.date].push(signature);
    });
    
    return signaturesByDay;
  };

  // Générer un PDF avec un calendrier des signatures
  const generateCalendarSignaturesPDF = async (
    formationId: string, 
    formationTitre: string, 
    students: any[]
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const signaturesByDay = await getSignaturesByDay(formationId);
      
      if (Object.keys(signaturesByDay).length === 0) {
        alert('Aucune signature trouvée pour cette formation');
        return false;
      }
      
      // Créer un nouveau document PDF en mode paysage
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Ajouter le titre
      doc.setFontSize(18);
      doc.text(`Feuille de présence - ${formationTitre}`, 14, 22);
      
      // Date d'édition
      const today = new Date();
      doc.setFontSize(10);
      doc.text(`Édité le ${today.toLocaleDateString('fr-FR')} à ${today.toLocaleTimeString('fr-FR')}`, 14, 30);
      
      // Trier les dates (du plus ancien au plus récent)
      const sortedDates = Object.keys(signaturesByDay).sort();
      
      // Fonction pour obtenir le numéro de la semaine
      const getWeekNumber = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      };
      
      // Regrouper les dates par semaine
      const weeks: { [weekNumber: string]: string[] } = {};
      
      sortedDates.forEach(dateStr => {
        const date = new Date(dateStr);
        // Obtenir le numéro de la semaine
        const weekNumber = getWeekNumber(date);
        if (!weeks[weekNumber]) {
          weeks[weekNumber] = [];
        }
        weeks[weekNumber].push(dateStr);
      });
      
      // Position Y initiale
      let yPosition = 40;
      
      // Pour chaque semaine
      Object.entries(weeks).forEach(([weekNumber, datesInWeek], weekIndex) => {
        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition > 180) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Ajouter le titre de la semaine
        doc.setFontSize(14);
        doc.text(`Semaine ${weekNumber}`, 14, yPosition);
        yPosition += 10;
        
        // Créer un tableau simple sans autoTable
        const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
        const daysInWeekMap: { [day: string]: string } = {};
        
        // Déterminer les jours présents dans cette semaine
        datesInWeek.forEach(dateStr => {
          const date = new Date(dateStr);
          const dayOfWeek = date.getDay(); // 0 = dimanche, 1 = lundi, etc.
          
          // Ignorer les weekends
          if (dayOfWeek > 0 && dayOfWeek < 6) {
            const dayIndex = dayOfWeek - 1; // 0 = lundi, 1 = mardi, etc.
            const dayName = weekDays[dayIndex];
            
            // Formater la date pour l'affichage
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            
            daysInWeekMap[dayName] = `${day}/${month}`;
          }
        });
        
        // Dessiner l'en-tête du tableau manuellement
        const cellWidth = 35;
        const cellHeight = 10;
        const tableX = 14;
        let tableY = yPosition;
        
        // Dessiner le fond de l'en-tête
        doc.setFillColor(220, 220, 220);
        doc.rect(tableX, tableY, 50, cellHeight, 'F');
        
        // Dessiner le texte de l'en-tête "Étudiant"
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('Étudiant', tableX + 25, tableY + cellHeight/2, { align: 'center', baseline: 'middle' });
        
        // Dessiner les en-têtes des jours
        let dayX = tableX + 50;
        weekDays.forEach(day => {
          if (daysInWeekMap[day]) {
            // Dessiner le fond
            doc.setFillColor(220, 220, 220);
            doc.rect(dayX, tableY, cellWidth, cellHeight, 'F');
            
            // Dessiner le texte
            doc.setFontSize(8);
            doc.text(`${day}`, dayX + cellWidth/2, tableY + cellHeight/2 - 2, { align: 'center', baseline: 'middle' });
            doc.text(`${daysInWeekMap[day]}`, dayX + cellWidth/2, tableY + cellHeight/2 + 2, { align: 'center', baseline: 'middle' });
            
            dayX += cellWidth;
          }
        });
        
        // Dessiner les lignes pour chaque étudiant
        tableY += cellHeight;
        
        students.forEach((student, index) => {
          // Dessiner la cellule pour le nom de l'étudiant
          doc.setFillColor(255, 255, 255);
          doc.rect(tableX, tableY, 50, cellHeight, 'F');
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
          
          // Tronquer le nom s'il est trop long
          let studentName = student.displayName || student.email;
          if (studentName.length > 25) {
            studentName = studentName.substring(0, 22) + '...';
          }
          
          doc.text(studentName, tableX + 2, tableY + cellHeight/2, { baseline: 'middle' });
          
          // Dessiner les cellules pour chaque jour
          dayX = tableX + 50;
          weekDays.forEach(day => {
            if (daysInWeekMap[day]) {
              // Trouver la date correspondante
              const fullDate = datesInWeek.find(d => {
                const date = new Date(d);
                const dayOfWeek = date.getDay();
                return dayOfWeek === weekDays.indexOf(day) + 1;
              });
              
              let status = '';
              let bgColor = [255, 255, 255]; // Blanc par défaut
              let textColor = [0, 0, 0]; // Noir par défaut
              
              if (fullDate && signaturesByDay[fullDate]) {
                // Vérifier si l'étudiant a signé ce jour-là
                const hasSigned = signaturesByDay[fullDate].some((sig: any) => sig.userId === student.id);
                
                if (hasSigned) {
                  status = 'Signé';
                  bgColor = [200, 250, 200]; // Vert clair
                  textColor = [0, 100, 0]; // Vert foncé
                } else {
                  // Vérifier si le jour est dans le futur
                  const dateObj = new Date(fullDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  if (dateObj > today) {
                    status = 'À venir';
                    bgColor = [240, 240, 240]; // Gris clair
                    textColor = [100, 100, 100]; // Gris foncé
                  } else {
                    status = 'Absent';
                    bgColor = [250, 200, 200]; // Rouge clair
                    textColor = [150, 0, 0]; // Rouge foncé
                  }
                }
              }
              
              // Dessiner le fond de la cellule
              doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
              doc.rect(dayX, tableY, cellWidth, cellHeight, 'F');
              
              // Dessiner le texte
              doc.setTextColor(textColor[0], textColor[1], textColor[2]);
              doc.text(status, dayX + cellWidth/2, tableY + cellHeight/2, { align: 'center', baseline: 'middle' });
              
              dayX += cellWidth;
            }
          });
          
          tableY += cellHeight;
        });
        
        // Mettre à jour la position Y pour le prochain tableau
        yPosition = tableY + 15;
      });
      
      // Ajouter une nouvelle page pour les signatures
      doc.addPage();
      
      // Titre pour la page des signatures
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Signatures détaillées', 14, 20);
      
      // Position Y pour les signatures
      let sigY = 30;
      let sigX = 14;
      const sigWidth = 80;
      const sigHeight = 40;
      const maxSigsPerRow = 3;
      let sigCount = 0;
      
      // Pour chaque jour avec des signatures
      sortedDates.forEach(date => {
        // Formater la date
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        
        // Vérifier si on a besoin d'une nouvelle page
        if (sigY > 180) {
          doc.addPage();
          sigY = 20;
        }
        
        // Titre du jour
        doc.setFontSize(14);
        doc.text(`${formattedDate}`, 14, sigY);
        sigY += 10;
        
        // Réinitialiser la position X et le compteur pour ce jour
        sigX = 14;
        sigCount = 0;
        
        // Pour chaque signature de ce jour
        signaturesByDay[date].forEach((signature: any) => {
          // Vérifier si on doit passer à la ligne suivante
          if (sigCount >= maxSigsPerRow) {
            sigY += sigHeight + 15;
            sigX = 14;
            sigCount = 0;
            
            // Vérifier si on a besoin d'une nouvelle page
            if (sigY > 180) {
              doc.addPage();
              sigY = 20;
            }
          }
          
          // Dessiner un cadre pour la signature
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.rect(sigX, sigY, sigWidth, sigHeight);
          
          // Ajouter le nom de l'étudiant
          doc.setFontSize(10);
          doc.text(signature.userName, sigX + 5, sigY + 5);
          
          // Ajouter l'heure de la signature
          const signTime = new Date(signature.createdAt.toDate()).toLocaleTimeString('fr-FR');
          doc.setFontSize(8);
          doc.text(signTime, sigX + 5, sigY + 10);
          
          try {
            // Ajouter l'image de la signature
            const imgData = signature.signatureData;
            doc.addImage(imgData, 'PNG', sigX + 5, sigY + 15, sigWidth - 10, sigHeight - 20);
          } catch (imgError) {
            console.error('Erreur lors de l\'ajout de l\'image:', imgError);
            doc.setFontSize(10);
            doc.text('Erreur d\'affichage de la signature', sigX + 5, sigY + 25);
          }
          
          // Mettre à jour la position X et le compteur
          sigX += sigWidth + 10;
          sigCount++;
        });
        
        // Passer à la ligne suivante pour le prochain jour
        sigY += sigHeight + 15;
      });
      
      // Télécharger le PDF
      doc.save(`signatures_${formationTitre.replace(/\s+/g, '_')}.pdf`);
      
      return true;
    } catch (error: any) {
      console.error('Erreur lors de la génération du PDF:', error);
      setError(error.message || 'Une erreur est survenue lors de la génération du PDF');
      alert('Une erreur est survenue lors de la génération du PDF');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction utilitaire pour obtenir le numéro de la semaine
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Fonction pour ajouter une signature manuellement (pour les formateurs)
  const addManualSignature = async (formationId: string, formationTitre: string, userId: string, userName: string, signatureData: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await addDoc(collection(db, 'signatures'), {
        userId,
        userName,
        formationId,
        formationTitre,
        signatureData,
        createdAt: serverTimestamp()
      });
      
      return true;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de l\'ajout de la signature');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Ajouter cette fonction dans le hook useSignatures
  const getSignaturesByPeriod = async (formationId: string, startDate: string, endDate: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Recherche des signatures pour la formation: ${formationId} du ${startDate} au ${endDate}`);
      
      // Convertir les dates en objets Date
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      // Convertir en Timestamp Firestore
      const startTimestamp = Timestamp.fromDate(start);
      const endTimestamp = Timestamp.fromDate(end);
      
      const signaturesRef = collection(db, 'signatures');
      const q = query(
        signaturesRef,
        where('formationId', '==', formationId),
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp),
        orderBy('createdAt', 'desc')
      );
      
      try {
        const querySnapshot = await getDocs(q);
        console.log(`Nombre de signatures trouvées: ${querySnapshot.size}`);
        
        const signatures: Signature[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt as Timestamp;
          
          // Ajouter une propriété date au format YYYY-MM-DD
          const dateObj = createdAt.toDate();
          const date = dateObj.toISOString().split('T')[0]; // Format YYYY-MM-DD
          
          signatures.push({
            id: doc.id,
            ...data,
            date
          } as Signature);
        });
        
        return signatures;
      } catch (indexError: any) {
        console.error("Erreur d'index:", indexError.message);
        
        // Utiliser une approche alternative sans les contraintes d'index
        const qWithoutOrder = query(
          signaturesRef,
          where('formationId', '==', formationId)
        );
        
        const fallbackSnapshot = await getDocs(qWithoutOrder);
        
        const signatures: Signature[] = [];
        fallbackSnapshot.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt as Timestamp;
          const dateObj = createdAt.toDate();
          
          // Vérifier si la date est dans la plage demandée
          if (dateObj >= start && dateObj <= end) {
            const date = dateObj.toISOString().split('T')[0]; // Format YYYY-MM-DD
            
            signatures.push({
              id: doc.id,
              ...data,
              date
            } as Signature);
          }
        });
        
        // Tri manuel par date (du plus récent au plus ancien)
        signatures.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        
        return signatures;
      }
    } catch (error: any) {
      console.error("Erreur lors de la récupération des signatures:", error);
      setError(error.message || 'Une erreur est survenue lors de la récupération des signatures');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Ajouter cette fonction pour regrouper les signatures par jour dans une période spécifique
  const getSignaturesByDayInPeriod = async (formationId: string, startDate: string, endDate: string) => {
    const signatures = await getSignaturesByPeriod(formationId, startDate, endDate);
    
    // Regrouper les signatures par jour
    const signaturesByDay: { [date: string]: Signature[] } = {};
    
    signatures.forEach(signature => {
      if (!signature.date) return;
      
      if (!signaturesByDay[signature.date]) {
        signaturesByDay[signature.date] = [];
      }
      
      signaturesByDay[signature.date].push(signature);
    });
    
    return signaturesByDay;
  };

  // Générer un PDF avec un calendrier des signatures pour une période spécifique
  const generatePeriodSignaturesPDF = async (
    formationId: string, 
    formationTitre: string, 
    students: any[],
    startDate: string,
    endDate: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const signaturesByDay = await getSignaturesByDayInPeriod(formationId, startDate, endDate);
      
      if (Object.keys(signaturesByDay).length === 0) {
        alert('Aucune signature trouvée pour cette période');
        return false;
      }
      
      // Créer un nouveau document PDF en mode paysage
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Ajouter le titre
      doc.setFontSize(18);
      doc.text(`Feuille de présence - ${formationTitre}`, 14, 22);
      
      // Ajouter la période
      doc.setFontSize(12);
      const startFormatted = new Date(startDate).toLocaleDateString('fr-FR');
      const endFormatted = new Date(endDate).toLocaleDateString('fr-FR');
      doc.text(`Période: du ${startFormatted} au ${endFormatted}`, 14, 32);
      
      // Date d'édition
      const today = new Date();
      doc.setFontSize(10);
      doc.text(`Édité le ${today.toLocaleDateString('fr-FR')} à ${today.toLocaleTimeString('fr-FR')}`, 14, 38);
      
      // Trier les dates (du plus ancien au plus récent)
      const sortedDates = Object.keys(signaturesByDay).sort();
      
      // Fonction pour obtenir le numéro de la semaine
      const getWeekNumber = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      };
      
      // Regrouper les dates par semaine
      const weeks: { [weekNumber: string]: string[] } = {};
      
      sortedDates.forEach(dateStr => {
        const date = new Date(dateStr);
        // Obtenir le numéro de la semaine
        const weekNumber = getWeekNumber(date);
        if (!weeks[weekNumber]) {
          weeks[weekNumber] = [];
        }
        weeks[weekNumber].push(dateStr);
      });
      
      // Position Y initiale
      let yPosition = 45;
      
      // Pour chaque semaine
      Object.entries(weeks).forEach(([weekNumber, datesInWeek], weekIndex) => {
        // Vérifier si on a besoin d'une nouvelle page
        if (yPosition > 180) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Ajouter le titre de la semaine
        doc.setFontSize(14);
        doc.text(`Semaine ${weekNumber}`, 14, yPosition);
        yPosition += 10;
        
        // Créer un tableau simple sans autoTable
        const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
        const daysInWeekMap: { [day: string]: string } = {};
        
        // Déterminer les jours présents dans cette semaine
        datesInWeek.forEach(dateStr => {
          const date = new Date(dateStr);
          const dayOfWeek = date.getDay(); // 0 = dimanche, 1 = lundi, etc.
          
          // Ignorer les weekends
          if (dayOfWeek > 0 && dayOfWeek < 6) {
            const dayIndex = dayOfWeek - 1; // 0 = lundi, 1 = mardi, etc.
            const dayName = weekDays[dayIndex];
            
            // Formater la date pour l'affichage
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            
            daysInWeekMap[dayName] = `${day}/${month}`;
          }
        });
        
        // Dessiner l'en-tête du tableau manuellement
        const cellWidth = 35;
        const cellHeight = 10;
        const tableX = 14;
        let tableY = yPosition;
        
        // Dessiner le fond de l'en-tête
        doc.setFillColor(220, 220, 220);
        doc.rect(tableX, tableY, 50, cellHeight, 'F');
        
        // Dessiner le texte de l'en-tête "Étudiant"
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('Étudiant', tableX + 25, tableY + cellHeight/2, { align: 'center', baseline: 'middle' });
        
        // Dessiner les en-têtes des jours
        let dayX = tableX + 50;
        weekDays.forEach(day => {
          if (daysInWeekMap[day]) {
            // Dessiner le fond
            doc.setFillColor(220, 220, 220);
            doc.rect(dayX, tableY, cellWidth, cellHeight, 'F');
            
            // Dessiner le texte
            doc.setFontSize(8);
            doc.text(`${day}`, dayX + cellWidth/2, tableY + cellHeight/2 - 2, { align: 'center', baseline: 'middle' });
            doc.text(`${daysInWeekMap[day]}`, dayX + cellWidth/2, tableY + cellHeight/2 + 2, { align: 'center', baseline: 'middle' });
            
            dayX += cellWidth;
          }
        });
        
        // Dessiner les lignes pour chaque étudiant
        tableY += cellHeight;
        
        students.forEach((student, index) => {
          // Dessiner la cellule pour le nom de l'étudiant
          doc.setFillColor(255, 255, 255);
          doc.rect(tableX, tableY, 50, cellHeight, 'F');
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
          
          // Tronquer le nom s'il est trop long
          let studentName = student.displayName || student.email;
          if (studentName.length > 25) {
            studentName = studentName.substring(0, 22) + '...';
          }
          
          doc.text(studentName, tableX + 2, tableY + cellHeight/2, { baseline: 'middle' });
          
          // Dessiner les cellules pour chaque jour
          dayX = tableX + 50;
          weekDays.forEach(day => {
            if (daysInWeekMap[day]) {
              // Trouver la date correspondante
              const fullDate = datesInWeek.find(d => {
                const date = new Date(d);
                const dayOfWeek = date.getDay();
                return dayOfWeek === weekDays.indexOf(day) + 1;
              });
              
              let status = '';
              let bgColor = [255, 255, 255]; // Blanc par défaut
              let textColor = [0, 0, 0]; // Noir par défaut
              
              if (fullDate && signaturesByDay[fullDate]) {
                // Vérifier si l'étudiant a signé ce jour-là
                const hasSigned = signaturesByDay[fullDate].some((sig: any) => sig.userId === student.id);
                
                if (hasSigned) {
                  status = 'Signé';
                  bgColor = [200, 250, 200]; // Vert clair
                  textColor = [0, 100, 0]; // Vert foncé
                } else {
                  // Vérifier si le jour est dans le futur
                  const dateObj = new Date(fullDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  if (dateObj > today) {
                    status = 'À venir';
                    bgColor = [240, 240, 240]; // Gris clair
                    textColor = [100, 100, 100]; // Gris foncé
                  } else {
                    status = 'Absent';
                    bgColor = [250, 200, 200]; // Rouge clair
                    textColor = [150, 0, 0]; // Rouge foncé
                  }
                }
              }
              
              // Dessiner le fond de la cellule
              doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
              doc.rect(dayX, tableY, cellWidth, cellHeight, 'F');
              
              // Dessiner le texte
              doc.setTextColor(textColor[0], textColor[1], textColor[2]);
              doc.text(status, dayX + cellWidth/2, tableY + cellHeight/2, { align: 'center', baseline: 'middle' });
              
              dayX += cellWidth;
            }
          });
          
          tableY += cellHeight;
        });
        
        // Mettre à jour la position Y pour le prochain tableau
        yPosition = tableY + 15;
      });
      
      // Ajouter une nouvelle page pour les signatures
      doc.addPage();
      
      // Titre pour la page des signatures
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Signatures détaillées', 14, 20);
      
      // Position Y pour les signatures
      let sigY = 30;
      let sigX = 14;
      const sigWidth = 80;
      const sigHeight = 40;
      const maxSigsPerRow = 3;
      let sigCount = 0;
      
      // Pour chaque jour avec des signatures
      sortedDates.forEach(date => {
        // Formater la date
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        
        // Vérifier si on a besoin d'une nouvelle page
        if (sigY > 180) {
          doc.addPage();
          sigY = 20;
        }
        
        // Titre du jour
        doc.setFontSize(14);
        doc.text(`${formattedDate}`, 14, sigY);
        sigY += 10;
        
        // Réinitialiser la position X et le compteur pour ce jour
        sigX = 14;
        sigCount = 0;
        
        // Pour chaque signature de ce jour
        signaturesByDay[date].forEach((signature: any) => {
          // Vérifier si on doit passer à la ligne suivante
          if (sigCount >= maxSigsPerRow) {
            sigY += sigHeight + 15;
            sigX = 14;
            sigCount = 0;
            
            // Vérifier si on a besoin d'une nouvelle page
            if (sigY > 180) {
              doc.addPage();
              sigY = 20;
            }
          }
          
          // Dessiner un cadre pour la signature
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.rect(sigX, sigY, sigWidth, sigHeight);
          
          // Ajouter le nom de l'étudiant
          doc.setFontSize(10);
          doc.text(signature.userName, sigX + 5, sigY + 5);
          
          // Ajouter l'heure de la signature
          const signTime = new Date(signature.createdAt.toDate()).toLocaleTimeString('fr-FR');
          doc.setFontSize(8);
          doc.text(signTime, sigX + 5, sigY + 10);
          
          try {
            // Ajouter l'image de la signature
            const imgData = signature.signatureData;
            doc.addImage(imgData, 'PNG', sigX + 5, sigY + 15, sigWidth - 10, sigHeight - 20);
          } catch (imgError) {
            console.error('Erreur lors de l\'ajout de l\'image:', imgError);
            doc.setFontSize(10);
            doc.text('Erreur d\'affichage de la signature', sigX + 5, sigY + 25);
          }
          
          // Mettre à jour la position X et le compteur
          sigX += sigWidth + 10;
          sigCount++;
        });
        
        // Passer à la ligne suivante pour le prochain jour
        sigY += sigHeight + 15;
      });
      
      // Télécharger le PDF
      const startFormatted2 = new Date(startDate).toLocaleDateString('fr-FR').replace(/\//g, '-');
      const endFormatted2 = new Date(endDate).toLocaleDateString('fr-FR').replace(/\//g, '-');
      doc.save(`signatures_${formationTitre.replace(/\s+/g, '_')}_${startFormatted2}_${endFormatted2}.pdf`);
      
      return true;
    } catch (error: any) {
      console.error('Erreur lors de la génération du PDF:', error);
      setError(error.message || 'Une erreur est survenue lors de la génération du PDF');
      alert('Une erreur est survenue lors de la génération du PDF');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Ajouter cette fonction dans le hook useSignatures
  const hasSignedToday = async (formationId: string, userId: string) => {
    try {
      // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Convertir en Timestamp Firestore
      const todayTimestamp = Timestamp.fromDate(today);
      const tomorrowTimestamp = Timestamp.fromDate(tomorrow);
      
      const signaturesRef = collection(db, 'signatures');
      const q = query(
        signaturesRef,
        where('formationId', '==', formationId),
        where('userId', '==', userId),
        where('createdAt', '>=', todayTimestamp),
        where('createdAt', '<', tomorrowTimestamp)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Erreur lors de la vérification de signature:", error);
      return false;
    }
  };

  return {
    loading,
    error,
    getSignaturesByFormation,
    getSignaturesByDay,
    getSignaturesByPeriod,
    getSignaturesByDayInPeriod,
    generatePeriodSignaturesPDF,
    addManualSignature,
    hasSignedToday
  };
} 